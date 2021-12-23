#include "sound.h"
#include "lv.h"
#include "api.h"
#include "js.h"
#include "clock.h"

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
      for (auto &clock : clocks) {
        clock->update(dt);
        // TODO:
        // stream { clockStartTime, pattern, instrument }
        // for each stream on this clock,
        //   if the clock time >= stream's nextTime,
        //     fire stream's next events (play notes)
        //   if the stream is done, remove the stream
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
  if (std::find(clocks.begin(), clocks.end(), clock) == clocks.end()) {
    clocks.push_back(clock);
  }
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

void Sound::play(Pattern &pattern, Instrument &instrument, int clockId) {
  // use clock to convert pattern to event stream
  // add stream+instrument to audio thread
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
