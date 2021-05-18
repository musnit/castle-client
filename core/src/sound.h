#pragma once

#include "precomp.h"

#include "soloud.h"
#include "soloud_sfxr.h"

class Sound {
  inline static bool hasInitializedSoloud = false;
  inline static SoLoud::Soloud soloud;
  inline static std::unordered_map<std::string, std::unique_ptr<SoLoud::Sfxr>> sfxrSounds;

public:
  Sound(const Sound &) = delete; // Prevent accidental copies
  Sound &operator=(const Sound &) = delete;
  Sound(Sound &&) = default; // Allow moves
  Sound &operator=(Sound &&) = default;

  Sound();
  ~Sound() = default;

  void play(const std::string &category, int seed, int mutationSeed, int mutationAmount);
};
