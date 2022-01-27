#include "sound.h"
#include "lv.h"
#include "api.h"
#include "js.h"
#include "clock.h"
#include "stream.h"
#include "sample.h"
#include "util.h"

#include <common/delay.h>

Sound::ClockThread::ClockThread(Sound &owner_)
    : owner(owner_) {
  threadName = "SoundClockThread";
}

void Sound::ClockThread::threadFunction() {
  while (true) {
    {
      love::thread::Lock lock(mutex);
      if (shouldFinish) {
        return;
      }
    }

    double dt = timer.step();
    {
      love::thread::Lock lock(mutex);
      for (auto &[clockId, clock] : clocks) {
        clock->update(dt);
        auto &streamsForClock = streams[clockId];
        auto iter = streamsForClock.begin();
        while (iter != streamsForClock.end()) {
          auto &stream = *iter;
          if (stream->hasNext()) {
            if (clock->getTime() >= stream->nextTime()) {
              stream->playNextNotes(owner);
            }
            ++iter;
          } else {
            // stream is exhausted, remove
            iter = streamsForClock.erase(iter);
          }
        }
      }
    }
    love::sleep(4);
  }
}

void Sound::ClockThread::finish() {
  love::thread::Lock lock(mutex);
  shouldFinish = true;
}

void Sound::ClockThread::addClock(Clock *clock) {
  // add clock to sound thread, noop if already added
  love::thread::Lock lock(mutex);
  if (clocks.find(clock->clockId) == clocks.end()) {
    clocks.emplace(clock->clockId, clock);
    streams.emplace(clock->clockId, std::vector<std::unique_ptr<Stream>>());
  }
}

int Sound::ClockThread::addStream(int clockId, std::unique_ptr<Pattern> pattern,
    std::unique_ptr<Instrument> instrument, StreamOptions opts) {
  love::thread::Lock lock(mutex);
  int result = -1;
  if (auto found = clocks.find(clockId); found != clocks.end()) {
    auto clock = found->second;
    double wait = 0;
    if (opts.quantize) {
      wait = clock->getTimeUntilNext(opts.quantizeUnits, 1);
    }
    auto stream = std::make_unique<Stream>(*clock, std::move(pattern), std::move(instrument), wait);
    stream->fastForward(opts.initialTimeInStream);
    // play sound immediately if warranted
    if (stream->hasNext() && clock->getTime() >= stream->nextTime()) {
      stream->playNextNotes(owner);
    }
    result = stream->streamId;
    streams[clockId].push_back(std::move(stream));
  }
  return result;
}

Stream *Sound::ClockThread::maybeGetStream(int clockId, int streamId) {
  love::thread::Lock lock(mutex);
  auto &streamsForClock = streams[clockId];
  for (auto &stream : streamsForClock) {
    if (stream->streamId == streamId) {
      return stream.get();
    }
  }
  return nullptr;
}

void Sound::ClockThread::stopStream(int clockId, int streamId, StreamOptions opts) {
  love::thread::Lock lock(mutex);
  auto &streamsForClock = streams[clockId];
  if (auto found = clocks.find(clockId); found != clocks.end()) {
    auto clock = found->second;
    double finishTime = 0;
    if (opts.quantize) {
      finishTime = clock->getTime() + clock->getTimeUntilNext(opts.quantizeUnits, 1);
    }
    for (auto &stream : streamsForClock) {
      if (stream->streamId == streamId) {
        stream->stop(finishTime);
      }
    }
  }
}

void Sound::ClockThread::clearStreams() {
  love::thread::Lock lock(mutex);
  streams.clear();
}

Sound::Sound() {
  initialize();
}

Sound::~Sound() {
  removeAllClocks();
}

void Sound::initialize() {
  if (!Sound::hasInitializedSoloud) {
    Sound::hasInitializedSoloud = true;
    Sound::soloud.init();
  }
}

void Sound::addClock(Clock *clock) {
  // start sound thread if not started
  if (!clockThread) {
    clockThread = new ClockThread(*this);
    clockThread->start();
  }
  clockThread->addClock(clock);
}

void Sound::removeAllClocks() {
  if (clockThread) {
    clockThread->finish();
    clockThread->wait();
    clockThread = nullptr;
  }
}

void Sound::stopAll() {
  if (Sound::hasInitializedSoloud) {
    Sound::soloud.stopAll();
  }
  clearStreams();
}

void Sound::clearStreams() {
  if (clockThread) {
    clockThread->clearStreams();
  }
}

int Sound::play(int clockId, std::unique_ptr<Pattern> pattern,
    std::unique_ptr<Instrument> instrument, StreamOptions opts) {
  if (clockThread) {
    return clockThread->addStream(clockId, std::move(pattern), std::move(instrument), opts);
  }
  return -1;
}

Stream *Sound::maybeGetStream(int clockId, int streamId) {
  if (clockThread) {
    return clockThread->maybeGetStream(clockId, streamId);
  }
}

void Sound::stopStream(int clockId, int streamId, StreamOptions opts) {
  if (clockThread) {
    clockThread->stopStream(clockId, streamId, opts);
  }
}

void Sound::preload(const Sample &sample) {
  initialize();

  auto &type = sample.type();
  auto &recordingUrl = sample.recordingUrl();
  auto &uploadUrl = sample.uploadUrl();

#ifndef __EMSCRIPTEN__
  if (type == "microphone" || type == "library") {
    auto url = type == "microhone" ? recordingUrl : uploadUrl;
    if (url == "") {
      return;
    }

    if (Sound::urlSounds.find(url) == Sound::urlSounds.end()) {
      API::getData(url, [=](APIDataResponse &response) {
        std::unique_ptr<SoLoud::WavStream> sound = std::make_unique<SoLoud::WavStream>();

        sound->loadMem(response.data, response.length, true, true);
        Sound::urlSounds.insert(std::make_pair(url, std::move(sound)));
      });
    }
  }
#endif
}

void Sound::play(const Sample &sample, double playbackRate, float amplitude) {
  initialize();

  if (playbackRate <= 0.0) {
    return;
  }

  auto &type = sample.type();
  if (type == "sfxr") {
    playEffect(playbackRate, amplitude, sample.category(), sample.seed(), sample.mutationSeed(),
        sample.mutationAmount());
  } else if (type == "tone") {
    playTone(playbackRate, amplitude, sample.midiNote(), sample.waveform(), sample.attack(),
        sample.sustain(), sample.release());
  } else {
    auto url = type == "microphone" ? sample.recordingUrl() : sample.uploadUrl();
    playUrl(playbackRate, amplitude, url);
  }
}

void Sound::playUrl(float playbackRate, float amplitude, const std::string &url) {
  if (url == "") {
    return;
  }

  if (Sound::urlSounds.find(url) == Sound::urlSounds.end()) {
    API::getData(url, [=](APIDataResponse &response) {
      std::unique_ptr<SoLoud::WavStream> sound = std::make_unique<SoLoud::WavStream>();

      sound->loadMem(response.data, response.length, true, true);
      Sound::urlSounds.insert(std::make_pair(url, std::move(sound)));

      int handle = Sound::soloud.play(*urlSounds[url]);
      Sound::soloud.setVolume(handle, amplitude);
      Sound::soloud.setRelativePlaySpeed(handle, playbackRate);
    });
  } else {
    int handle = Sound::soloud.play(*urlSounds[url]);
    Sound::soloud.setVolume(handle, amplitude);
    Sound::soloud.setRelativePlaySpeed(handle, playbackRate);
  }
}

void Sound::playEffect(float playbackRate, float amplitude, const std::string &category, int seed,
    int mutationSeed, int mutationAmount) {
  std::string key = "category: " + category + " seed:" + std::to_string(seed) + " mutationSeed:"
      + std::to_string(mutationSeed) + " mutationAmount:" + std::to_string(mutationAmount);

  if (Sound::sfxrSounds.find(key) == Sound::sfxrSounds.end()) {
    std::unique_ptr<SoLoud::Sfxr> sound = std::make_unique<SoLoud::Sfxr>();

    if (category == "pickup") {
      sound->loadPreset(SoLoud::Sfxr::COIN, seed);
    } else if (category == "laser") {
      sound->loadPreset(SoLoud::Sfxr::LASER, seed);
    } else if (category == "explosion") {
      sound->loadPreset(SoLoud::Sfxr::EXPLOSION, seed);
    } else if (category == "powerup") {
      sound->loadPreset(SoLoud::Sfxr::POWERUP, seed);
    } else if (category == "hit") {
      sound->loadPreset(SoLoud::Sfxr::HURT, seed);
    } else if (category == "jump") {
      sound->loadPreset(SoLoud::Sfxr::JUMP, seed);
    } else if (category == "blip") {
      sound->loadPreset(SoLoud::Sfxr::BLIP, seed);
    } else {
      sound->loadPreset(7, seed);
    }

    if (mutationSeed != 0) {
      sound->mutate(mutationAmount, seed + mutationSeed);
    }

    sound->clampLength();

    Sound::sfxrSounds.insert(std::make_pair(key, std::move(sound)));
  }

  int handle = Sound::soloud.play(*Sound::sfxrSounds[key]);
  Sound::soloud.setVolume(handle, amplitude);
  Sound::soloud.setRelativePlaySpeed(handle, playbackRate);
}

void Sound::playTone(float playbackRate, float amplitude, int midiNote, const std::string &waveform,
    float attack, float sustain, float release) {
  std::string key = "midiNote: " + std::to_string(midiNote) + " waveform: " + waveform
      + " attack: " + std::to_string(attack) + " sustain: " + std::to_string(sustain)
      + " release: " + std::to_string(release);

  if (Sound::sfxrSounds.find(key) == Sound::sfxrSounds.end()) {
    std::unique_ptr<SoLoud::Sfxr> sound = std::make_unique<SoLoud::Sfxr>();

    sound->mParams.p_base_freq
        = SoundUtil::hzToSfxrFreq(SoundUtil::midicps(midiNote), sound->mBaseSamplerate);
    if (waveform == "square") {
      sound->mParams.wave_type = 0;
    } else if (waveform == "sawtooth") {
      sound->mParams.wave_type = 1;
    } else if (waveform == "sine") {
      sound->mParams.wave_type = 2;
    } else if (waveform == "noise") {
      sound->mParams.wave_type = 3;
    }
    sound->mParams.p_env_attack = attack;
    sound->mParams.p_env_sustain = sustain;
    sound->mParams.p_env_decay = release;
    sound->clampLength();

    Sound::sfxrSounds.insert(std::make_pair(key, std::move(sound)));
  }

  int handle = Sound::soloud.play(*Sound::sfxrSounds[key]);
  Sound::soloud.setVolume(handle, amplitude);
  Sound::soloud.setRelativePlaySpeed(handle, playbackRate);
}
