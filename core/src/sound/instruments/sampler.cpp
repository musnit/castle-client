#include "sampler.h"
#include "sound/util.h"

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
  Instrument::read(reader);
  reader.obj("sample", [&]() {
    reader.read(sample);
  });
}

void Sampler::play(Sound &sound, Pattern::Note note) {
  if (!props.muted()) {
    // play our given Sample, pitched up or down according to note.key

    // TODO: playbackRate is an expression to be compat with rules, but we don't
    // care about anything except constant values here
    /* auto basePlaybackRate = std::clamp(
       params.playbackRate().eval<double>(ctx), Sample::minPlaybackRate, Sample::maxPlaybackRate);
     */

    auto basePlaybackRate = 1.0f;
    auto keyFromMidiC4 = note.key - 60;
    auto playbackRate = basePlaybackRate * pow(2.0f, keyFromMidiC4 / 12.0f);
    auto amplitude = SoundUtil::velocityToAmp(note.vel);

    sound.play(sample, playbackRate, amplitude);
  }
}
