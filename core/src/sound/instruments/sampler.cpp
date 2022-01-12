#include "sampler.h"

Sampler::Sampler() {
  sample.type() = "tone";
}

Sampler::~Sampler() {
}

void Sampler::write(Writer &writer) const {
  Instrument::write(writer);
  writer.write("sample", sample);
}

void Sampler::read(Reader &reader) {
  reader.obj("sample", [&]() {
    reader.read(sample);
  });
}

void Sampler::play(Sound &sound, Pattern::Note note) {
  // play our given Sample, pitched up or down according to note.key

  // TODO: playbackRate is an expression to be compat with rules, but we don't
  // care about anything except constant values here
  /* auto basePlaybackRate = std::clamp(
     params.playbackRate().eval<double>(ctx), Sample::minPlaybackRate, Sample::maxPlaybackRate); */

  auto basePlaybackRate = 1.0f;
  auto keyFromMidiC3 = note.key - 48;
  auto playbackRate = basePlaybackRate * pow(2.0f, keyFromMidiC3 / 12.0f);

  sound.play(sample, playbackRate);
}
