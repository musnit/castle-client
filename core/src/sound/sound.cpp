#include "sound.h"
#include "lv.h"
#include "api.h"
#include "js.h"
#include "clock.h"
#include "stream.h"

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
            if (clock->getPerformTime() >= stream->nextTime()) {
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

void Sound::ClockThread::addStream(int clockId, Pattern &pattern, Instrument &instrument) {
  love::thread::Lock lock(mutex);
  if (auto found = clocks.find(clockId); found != clocks.end()) {
    auto clock = found->second;
    auto clockTime = clock->getPerformTime();
    auto timePerStep = clock->getTimePerStep(); // TODO: measure differently when we allow changing
                                                // clocks in real time
    auto stream = std::make_unique<Stream>(clockTime, timePerStep, pattern, instrument);
    // play sound immediately if warranted
    if (clockTime >= stream->nextTime()) {
      stream->playNextNotes(owner);
    }
    streams[clockId].push_back(std::move(stream));
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
  if (clockThread) {
    clockThread->clearStreams();
  }
}

void Sound::play(int clockId, Pattern &pattern, Instrument &instrument) {
  if (clockThread) {
    clockThread->addStream(clockId, pattern, instrument);
  }
}

void Sound::preload(const std::string &type, const std::string &recordingUrl,
    const std::string &uploadUrl, const std::string &category, int seed, int mutationSeed,
    int mutationAmount) {
  initialize();

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

void Sound::play(const std::string &type, float playbackRate, const std::string &recordingUrl,
    const std::string &uploadUrl, const std::string &category, int seed, int mutationSeed,
    int mutationAmount) {
  initialize();

  if (playbackRate <= 0.0) {
    return;
  }

  if (type == "sfxr") {
    playEffect(playbackRate, category, seed, mutationSeed, mutationAmount);
  } else {
    auto url = type == "microphone" ? recordingUrl : uploadUrl;
    playUrl(playbackRate, url);
  }
}

void Sound::playUrl(float playbackRate, const std::string &url) {
  if (url == "") {
    return;
  }

  if (Sound::urlSounds.find(url) == Sound::urlSounds.end()) {
    API::getData(url, [=](APIDataResponse &response) {
      std::unique_ptr<SoLoud::WavStream> sound = std::make_unique<SoLoud::WavStream>();

      sound->loadMem(response.data, response.length, true, true);
      Sound::urlSounds.insert(std::make_pair(url, std::move(sound)));

      int handle = Sound::soloud.play(*urlSounds[url]);
      Sound::soloud.setRelativePlaySpeed(handle, playbackRate);
    });
  } else {
    int handle = Sound::soloud.play(*urlSounds[url]);
    Sound::soloud.setRelativePlaySpeed(handle, playbackRate);
  }
}

void Sound::playEffect(float playbackRate, const std::string &category, int seed, int mutationSeed,
    int mutationAmount) {
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
  Sound::soloud.setRelativePlaySpeed(handle, playbackRate);
}
