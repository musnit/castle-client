#include "drums.h"
#include "sound/util.h"

Drums::Drums() {
}

Drums::~Drums() {
}

void Drums::write(Writer &writer) const {
  Instrument::write(writer);
  // TODO: sparse based on use* params
  writer.write("params", params);
}

void Drums::read(Reader &reader) {
  Instrument::read(reader);
  reader.obj("params", [&]() {
    reader.read(params);
  });
}

void Drums::playKick(Sound &sound, Params::Kick &kick, float amplitude) {
  if (kickKey == "") {
    Archive archive;
    archive.write([&](Archive::Writer &w) {
      w.write("kick", kick);
    });
    kickKey = archive.toJson();
  }

  sound.getOrMakeSfxrSourceForKey(kickKey, [&](SoLoud::Sfxr *source) {
    // big sine
    source->mParams.wave_type = 2;
    source->mParams.sound_vol = 0.9f;

    // decay
    source->mParams.p_env_decay = kick.decay();
    source->mParams.p_env_punch = 0.75f;

    // punch affects filter, p_lpf_freq is 0-1
    source->mParams.filter_on = true;
    source->mParams.p_lpf_freq
        = std::pow(0.1f, 1.0f - kick.punch()) * std::pow(0.95f, kick.punch());
    source->mParams.p_lpf_ramp = (-0.9f + kick.decay() * 0.5f) * source->mParams.p_lpf_freq;
    source->mParams.p_lpf_resonance = 0.5f;

    // base kick freq
    source->mParams.p_base_freq = SoundUtil::hzToSfxrFreq(kick.freq(), source->mBaseSamplerate);

    // sfxr freq ramp is -1 to 1, we want zero (no sweep) to some negative ramp (more sweep)
    source->mParams.p_freq_ramp = kick.sweep() * -0.3f;
    source->mParams.p_freq_limit = SoundUtil::hzToSfxrFreq(20.0f, source->mBaseSamplerate);
  });

  sound.playSfxr(kickKey, amplitude);
}

void Drums::play(Sound &sound, Pattern::Note note) {
  if (!props.muted()) {
    auto amplitude = SoundUtil::velocityToAmp(note.vel);
    int midiNote = int(note.key);
    switch (midiNote) {
      // TODO: other drums
    case 36:
    default: {
      if (params.useKick()) {
        playKick(sound, params.kick(), amplitude);
      }
      break;
    }
    };
  }
}
