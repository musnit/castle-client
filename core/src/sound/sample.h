#pragma once

#include "props.h"
#include "behaviors/rules.h"

struct Sample {
  static constexpr double minPlaybackRate = 0.0;
  static constexpr double maxPlaybackRate = 10.0;

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
  PROP(
       std::string, waveform,
       .label("waveform")
       .allowedValues("square", "sawtooth", "sine", "noise")
       ) = "square";
  PROP(
       float, attack,
       .label("attack")
       .min(0.0f)
       .max(1.0f)
       ) = 0.0f;
  PROP(
       float, release,
       .label("release")
       .min(0.0f)
       .max(1.0f)
       ) = 0.4f;
};
