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

void Sampler::setInitialProps() {
  static love::RandomGenerator rng;
  unsigned seed = std::chrono::system_clock::now().time_since_epoch().count();
  rng.setSeed({ seed });

  // readable default name
  if (sample.type() == "sfxr") {
    props.name() = "effect";
  } else if (sample.type() == "microphone") {
    props.name() = "recording";
  } else if (sample.type() == "library") {
    props.name() = "file";
  } else if (sample.type() == "tone") {
    props.name() = "tone";
  }

  // if tone, randomize params slightly
  if (sample.type() == "tone") {
    auto randomWave = rng.rand() % 2;
    switch (randomWave) {
    case 0:
      sample.waveform() = "square";
      break;
    case 1:
    default:
      sample.waveform() = "sawtooth";
      break;
    }
    auto randomNote = 48 + int(rng.rand() % 3) * 12;
    sample.midiNote() = randomNote;
  }

  // if sfxr, randomize params
  if (sample.type() == "sfxr") {
    auto randomCategory = rng.rand() % 7;
    switch (randomCategory) {
    case 0:
      sample.category() = "pickup";
      break;
    case 1:
      sample.category() = "laser";
      break;
    case 2:
    default:
      sample.category() = "explosion";
      break;
    case 3:
      sample.category() = "powerup";
      break;
    case 4:
      sample.category() = "hit";
      break;
    case 5:
      sample.category() = "jump";
      break;
    case 6:
      sample.category() = "blip";
      break;
    }
    sample.seed() = rng.rand() % 9999;
  }
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
    auto keyFromMidiC4 = note.key - getZeroKey();
    auto playbackRate = basePlaybackRate * pow(2.0f, keyFromMidiC4 / 12.0f);
    auto amplitude = SoundUtil::velocityToAmp(note.vel) * props.volume();

    sound.play(sample, playbackRate, amplitude);
  }
}
