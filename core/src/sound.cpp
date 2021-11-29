#include "sound.h"
#include "api.h"
#include "js.h"

JS_DEFINE(bool, JS_isAudioReady, (), { return !!window.isAudioReady });

Sound::Sound() {
  initialize();
}

void Sound::initialize() {
#ifdef __EMSCRIPTEN__
  if (!JS_isAudioReady()) {
    return;
  }
#endif

  if (!Sound::hasInitializedSoloud) {
    Sound::hasInitializedSoloud = true;
    Sound::soloud.init();
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
#ifdef __EMSCRIPTEN__
  if (!JS_isAudioReady()) {
    return;
  }
#endif

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
