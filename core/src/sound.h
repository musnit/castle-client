#pragma once

#include "precomp.h"

#include "soloud.h"
#include "soloud_sfxr.h"

class Sound {
  static bool hasInitializedSoloud;
  static SoLoud::Soloud soloud;
  static std::map<std::string, std::unique_ptr<SoLoud::Sfxr>> sfxrSounds;

public:
  Sound(const Sound &) = delete; // Prevent accidental copies
  Sound &operator=(const Sound &) = delete;
  Sound(Sound &&) = default; // Allow moves
  Sound &operator=(Sound &&) = default;

  Sound();
  ~Sound() = default;

  void play(std::string category, int seed, int mutationSeed, int mutationAmount);
};
