#pragma once

#include "precomp.h"

#include "soloud.h"
#include "soloud_sfxr.h"

class Sound {
  SoLoud::Soloud soloud;

public:
  Sound(const Sound &) = delete; // Prevent accidental copies
  Sound &operator=(const Sound &) = delete;
  Sound(Sound &&) = default; // Allow moves
  Sound &operator=(Sound &&) = default;

  Sound();
  ~Sound() = default;

  void play(std::string category, int seed, int mutationSeed, int mutationAmount);
};
