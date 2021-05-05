#include "sound.h"

static bool hasInitializedSoloud = false;

Sound::Sound() {
  if (!hasInitializedSoloud) {
    hasInitializedSoloud = true;
    soloud.init();
  }
}

void Sound::play(std::string category, int seed, int mutationSeed, int mutationAmount) {
  SoLoud::Sfxr *coin = new SoLoud::Sfxr();

  if (category == "pickup") {
    coin->loadPreset(SoLoud::Sfxr::COIN, seed);
  } else if (category == "laser") {
    coin->loadPreset(SoLoud::Sfxr::LASER, seed);
  } else if (category == "explosion") {
    coin->loadPreset(SoLoud::Sfxr::EXPLOSION, seed);
  } else if (category == "powerup") {
    coin->loadPreset(SoLoud::Sfxr::POWERUP, seed);
  } else if (category == "hit") {
    coin->loadPreset(SoLoud::Sfxr::HURT, seed);
  } else if (category == "jump") {
    coin->loadPreset(SoLoud::Sfxr::JUMP, seed);
  } else if (category == "blip") {
    coin->loadPreset(SoLoud::Sfxr::BLIP, seed);
  } else {
    coin->loadPreset(7, seed);
  }

  if (mutationSeed != 0) {
    coin->mutate(mutationAmount, seed + mutationSeed);
  }

  soloud.play(*coin);
}
