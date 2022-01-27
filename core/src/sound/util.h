#pragma once

namespace SoundUtil {
float midicps(int midiNote);
float hzToSfxrFreq(float hz, float srate);
float velocityToAmp(int vel);
};

inline float SoundUtil::midicps(int midiNote) {
  return std::pow(2.0f, float(midiNote - 69) / 12.0f) * 440.0f;
}

inline float SoundUtil::hzToSfxrFreq(float hz, float srate) {
  // why??
  auto S = 100.0f / (8.0f * srate);
  return std::sqrt(S * hz - 0.001f);
}

inline float SoundUtil::velocityToAmp(int vel) {
  // there's no standard for interpreting this, but the shape in this paper looked fine
  // https://www.cs.cmu.edu/~rbd/papers/velocity-icmc2006.pdf
  float decimal = (float(vel) / 128.0f);
  return decimal * decimal;
}
