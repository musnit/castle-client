#pragma once

#include "props.h"
#include "behaviors/rules.h"

struct Sample {
  static constexpr double minPlaybackRate = 0.0;
  static constexpr double maxPlaybackRate = 10.0;

  // TODO: maybe move to some util file
  static float midicps(int midiNote);
  static float hzToSfxrFreq(float hz, float srate);

  PROP(
       std::string, type,
       .label("sound type")
       .allowedValues("sfxr", "microphone", "library", "tone")
       ) = "sfxr";
  PROP(
      ExpressionRef, playbackRate,
      .label("playback rate")
      .min(minPlaybackRate)
      .max(maxPlaybackRate)
      ) = 1;
  PROP(std::string, recordingUrl) = "";
  PROP(std::string, uploadUrl) = "";
  PROP(
       std::string, category,
       .allowedValues("pickup", "laser", "explosion", "powerup", "hit", "jump", "blip", "random")
       )
          = "random";
  PROP(
       int, seed,
       .label("random seed")
       .min(0)
       ) = 1337;
  PROP(int, mutationSeed, .label("mutation seed")) = 0;
  PROP(
       int, mutationAmount,
       .label("mutation amount")
       .min(0)
       .max(20)
       ) = 5;

  // for 'tone'
  PROP(int, midiNote) = 60;
};

inline float Sample::midicps(int midiNote) {
  return std::pow(2.0f, float(midiNote - 69) / 12.0f) * 440.0f;
}

inline float Sample::hzToSfxrFreq(float hz, float srate) {
  // why??
  auto S = 100.0f / (8.0f * srate);
  return std::sqrt(S * hz - 0.001f);
}
