#pragma once

#include "precomp.h"

#include "soloud.h"
#include "soloud_sfxr.h"
#include "soloud_wavstream.h"

class Sound {
  inline static bool hasInitializedSoloud = false;
  inline static SoLoud::Soloud soloud;
  inline static std::unordered_map<std::string, std::unique_ptr<SoLoud::Sfxr>> sfxrSounds;
  inline static std::unordered_map<std::string, std::unique_ptr<SoLoud::WavStream>> urlSounds;

public:
  Sound(const Sound &) = delete; // Prevent accidental copies
  Sound &operator=(const Sound &) = delete;
  Sound(Sound &&) = default; // Allow moves
  Sound &operator=(Sound &&) = default;

  Sound();
  ~Sound() = default;

  void preload(const std::string &type, const std::string &recordingUrl,
      const std::string &uploadUrl, const std::string &category, int seed, int mutationSeed,
      int mutationAmount);
  void play(const std::string &type, float playbackRate, const std::string &recordingUrl,
      const std::string &uploadUrl, const std::string &category, int seed, int mutationSeed,
      int mutationAmount);
  static void clearCache() {
    sfxrSounds.clear();
    soloud.stopAll();
  }

  static void stopAll() {
    soloud.stopAll();
  }

private:
  void playUrl(float playbackRate, const std::string &url);
  void playEffect(float playbackRate, const std::string &category, int seed, int mutationSeed,
      int mutationAmount);
};
