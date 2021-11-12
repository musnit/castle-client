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

  void preload(const std::string &type, const std::string &url, const std::string &category,
      int seed, int mutationSeed, int mutationAmount);
  void play(const std::string &type, const std::string &url, const std::string &category, int seed,
      int mutationSeed, int mutationAmount);
  static void clearCache() {
    sfxrSounds.clear();
  }

private:
  void playRecording(const std::string &url);
  void playEffect(const std::string &category, int seed, int mutationSeed, int mutationAmount);
};
