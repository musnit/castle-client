#include "drums.h"
#include "sound/util.h"

Drums::Drums() {
}

Drums::~Drums() {
}

void Drums::write(Writer &writer) const {
  Instrument::write(writer);
  writer.obj("params", [&]() {
    // sparse write only the used drums
    writer.boolean("useKick", params.useKick());
    if (params.useKick()) {
      writer.write("kick", params.kick());
    }
    writer.boolean("useClosedHat", params.useClosedHat());
    if (params.useClosedHat()) {
      writer.write("closedHat", params.closedHat());
    }
    writer.boolean("useOpenHat", params.useOpenHat());
    if (params.useOpenHat()) {
      writer.write("openHat", params.openHat());
    }
    writer.boolean("useSnare", params.useSnare());
    if (params.useSnare()) {
      writer.write("snare", params.snare());
    }
    writer.boolean("useClap", params.useClap());
    if (params.useClap()) {
      writer.write("clap", params.clap());
    }
    writer.boolean("useHiTom", params.useHiTom());
    if (params.useHiTom()) {
      writer.write("hiTom", params.hiTom());
    }
    writer.boolean("useLoTom", params.useLoTom());
    if (params.useLoTom()) {
      writer.write("loTom", params.loTom());
    }
  });
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

  auto kickClickKey = kickKey + "-click";

  // main kick tone
  sound.getOrMakeSfxrSourceForKey(kickKey, [&](SoLoud::Sfxr *source) {
    // big sine
    source->mParams.wave_type = 2;
    source->mParams.sound_vol = 1.5f;

    // decay
    source->mParams.p_env_sustain = 0;
    source->mParams.p_env_decay = kick.decay();
    source->mParams.p_env_punch = 0.75f;

    // punch affects filter, p_lpf_freq is 0-1
    source->mParams.filter_on = true;
    source->mParams.p_lpf_freq
        = std::pow(0.1f, 1.0f - kick.punch()) * std::pow(0.95f, kick.punch());
    source->mParams.p_lpf_ramp = (-0.9f + kick.decay() * 0.5f) * source->mParams.p_lpf_freq;
    source->mParams.p_lpf_resonance = 0.5f;

    // sweep down to specified freq
    auto finalFreq = SoundUtil::hzToSfxrFreq(kick.freq(), source->mBaseSamplerate);
    auto initialFreq
        = std::pow(finalFreq, 1.0f - kick.sweep()) * std::pow(finalFreq * 3.0f, kick.sweep());
    auto delta = finalFreq - initialFreq;
    source->mParams.p_freq_ramp = std::min(delta * 2.5f, -0.2f);
    source->mParams.p_base_freq = initialFreq;
    source->mParams.p_freq_limit = finalFreq;
    source->mParams.castle_hold_freq_limit = true;
  });

  // subnoise click
  sound.getOrMakeSfxrSourceForKey(kickClickKey, [&](SoLoud::Sfxr *source) {
    source->mParams.wave_type = 3;
    source->mParams.p_base_freq = 0.7f;
    source->mParams.sound_vol = 0.2f + kick.punch() * 0.2f;

    // fixed very short decay
    source->mParams.p_env_sustain = 0;
    source->mParams.p_env_decay = 0.04f;
    source->mParams.p_env_punch = 0.75f;

    // open up filter if punch is higher
    source->mParams.filter_on = true;
    source->mParams.p_lpf_freq = std::pow(0.1f, 1.0f - kick.punch()) * std::pow(0.5f, kick.punch());
    source->mParams.p_lpf_ramp = -0.8f;
    source->mParams.p_lpf_resonance = 0.5f;
  });

  sound.playSfxr(kickKey, amplitude);
  sound.playSfxr(kickClickKey, amplitude);
}

void Drums::playHat(Sound &sound, bool closed, Params::Hat &hat, float amplitude) {
  std::string key;
  if (closed) {
    if (closedHatKey == "") {
      Archive archive;
      archive.write([&](Archive::Writer &w) {
        w.write("closedHat", hat);
      });
      closedHatKey = archive.toJson();
    }
    key = closedHatKey;
  } else {
    if (openHatKey == "") {
      Archive archive;
      archive.write([&](Archive::Writer &w) {
        w.write("openHat", hat);
      });
      openHatKey = archive.toJson();
    }
    key = openHatKey;
  }

  sound.getOrMakeSfxrSourceForKey(key, [&](SoLoud::Sfxr *source) {
    // noise
    source->mParams.wave_type = 3;
    source->mParams.sound_vol = 0.75f;

    // decay
    source->mParams.p_env_decay = hat.decay();
    source->mParams.p_env_sustain = closed ? 0 : 0.1f;
    source->mParams.p_env_punch = 0.3f;

    // noise freq
    source->mParams.p_base_freq = hat.freq();

    // more body = decrease hpf (pass more noise thru)
    source->mParams.filter_on = true;
    source->mParams.p_lpf_freq = 0.96f;
    source->mParams.p_lpf_resonance = 0.6f;
    source->mParams.p_hpf_freq = std::pow(0.999f, 1.0f - hat.body()) * std::pow(0.75f, hat.body());
    source->mParams.p_hpf_ramp = 0.2f;
  });

  sound.playSfxr(key, amplitude);
}

void Drums::playSnare(Sound &sound, Params::Snare &snare, float amplitude) {
  if (snareKey == "") {
    Archive archive;
    archive.write([&](Archive::Writer &w) {
      w.write("snare", snare);
    });
    snareKey = archive.toJson();
  }

  auto snareNoiseKey = snareKey + "-noise";

  sound.getOrMakeSfxrSourceForKey(snareKey, [&](SoLoud::Sfxr *source) {
    // hollow sine in tenor range representing snare membrane
    source->mParams.wave_type = 2;
    source->mParams.sound_vol = 1.5f - snare.freq() * 0.25f;
    source->mParams.p_base_freq
        = SoundUtil::hzToSfxrFreq(180.0f + 180.0f * snare.freq(), source->mBaseSamplerate);
    source->mParams.p_vib_strength = 0.66f;
    source->mParams.p_vib_speed = 0.1f;

    // tonal component decays faster
    source->mParams.p_env_decay = snare.decay() * 0.5f;
    source->mParams.p_env_sustain = 0.05f;
    source->mParams.p_env_punch = 0.77f;

    // bandpass
    source->mParams.filter_on = true;
    source->mParams.p_lpf_freq = 0.66f;
    source->mParams.p_lpf_resonance = 0.5f;
    source->mParams.p_hpf_freq = 0.18f;
    source->mParams.p_hpf_ramp = 0.06f;
  });

  sound.getOrMakeSfxrSourceForKey(snareNoiseKey, [&](SoLoud::Sfxr *source) {
    // noise for the snares
    source->mParams.wave_type = 3;
    source->mParams.sound_vol = 0.75f - snare.decay() * 0.5f;

    // decay, plus some built in sustain and punch
    source->mParams.p_env_decay = snare.decay();
    source->mParams.p_env_sustain = 0.05f;
    source->mParams.p_env_punch = 0.77f;

    // noise freq. built in vibrato
    source->mParams.p_base_freq = 0.4f + snare.freq() * 0.2f;
    source->mParams.p_vib_strength = 0.66f;
    source->mParams.p_vib_speed = 0.1f;

    // bandpass more aggressively than sine
    source->mParams.filter_on = true;
    source->mParams.p_lpf_freq = 0.66f;
    source->mParams.p_lpf_resonance = 0.5f;
    source->mParams.p_hpf_freq = 0.28f;
    source->mParams.p_hpf_ramp = 0.06f;

    // tambre affects noise flange
    source->mParams.p_pha_offset = snare.tambre() * 0.3f;
  });

  sound.playSfxr(snareKey, amplitude);
  sound.playSfxr(snareNoiseKey, amplitude);
}

void Drums::playClap(Sound &sound, Params::Clap &clap, float amplitude) {
  if (clapKey == "") {
    Archive archive;
    archive.write([&](Archive::Writer &w) {
      w.write("clap", clap);
    });
    clapKey = archive.toJson();
  }

  sound.getOrMakeSfxrSourceForKey(clapKey, [&](SoLoud::Sfxr *source) {
    // resonant noise
    source->mParams.wave_type = 3;
    source->mParams.sound_vol = 1.75f - clap.freq() * 0.25f;
    source->mParams.p_base_freq = 0.2f + clap.freq() * 0.05f;

    source->mParams.p_env_decay = clap.decay();
    source->mParams.p_env_sustain = 0.025f;
    source->mParams.p_env_punch = 0.8f;

    source->mParams.p_pha_offset = 0.1f;
    source->mParams.p_pha_ramp = -0.05f;

    // bandpass
    source->mParams.filter_on = true;
    source->mParams.p_lpf_freq
        = SoundUtil::hzToSfxrFreq(80.0f + 50.0f * clap.freq(), source->mBaseSamplerate);
    source->mParams.p_lpf_resonance = 0.75f;
    source->mParams.p_hpf_freq = 0.28f;
    source->mParams.p_hpf_ramp = 0.1f;
  });

  // triple the exact same sound with a delay in between to achieve the clap chorus effect
  sound.playSfxr(clapKey, amplitude * 0.8f, 0.01f);
  sound.playSfxr(clapKey, amplitude * 0.8f, 0.015f);
  sound.playSfxr(clapKey, amplitude * 0.8f, 0.02f);
}

void Drums::playTom(Sound &sound, bool hi, Params::Tom &tom, float amplitude) {
  std::string key;
  if (hi) {
    if (hiTomKey == "") {
      Archive archive;
      archive.write([&](Archive::Writer &w) {
        w.write("hiTom", tom);
      });
      hiTomKey = archive.toJson();
    }
    key = hiTomKey;
  } else {
    if (loTomKey == "") {
      Archive archive;
      archive.write([&](Archive::Writer &w) {
        w.write("loTom", tom);
      });
      loTomKey = archive.toJson();
    }
    key = loTomKey;
  }

  sound.getOrMakeSfxrSourceForKey(key, [&](SoLoud::Sfxr *source) {
    // hollow sine
    source->mParams.wave_type = 2;
    source->mParams.sound_vol = 1.75f - tom.freq() * 0.5f;
    float freq = (hi) ? 90.0f + tom.freq() * 180.0f : 80.0f + tom.freq() * 160.0f;
    source->mParams.p_base_freq = SoundUtil::hzToSfxrFreq(freq, source->mBaseSamplerate);

    // punch + decay
    source->mParams.p_env_decay = tom.decay();
    source->mParams.p_env_sustain = 0.05f;
    source->mParams.p_env_punch = 0.77f;

    // bandpass at some harmonic of base freq
    source->mParams.filter_on = true;
    source->mParams.p_lpf_freq = SoundUtil::hzToSfxrFreq(freq * 2.5f, source->mBaseSamplerate);
    source->mParams.p_lpf_resonance = 0.5f;
    source->mParams.p_hpf_freq = 0.18f;
    source->mParams.p_hpf_ramp = 0.06f;
  });

  sound.playSfxr(key, amplitude);
}

void Drums::play(Sound &sound, Pattern::Note note) {
  if (!props.muted()) {
    auto amplitude = SoundUtil::velocityToAmp(note.vel);
    int midiNote = int(note.key);
    switch (midiNote) {
    case 36:
    default: {
      if (params.useKick()) {
        playKick(sound, params.kick(), amplitude);
      }
      break;
    }
    case 37: {
      if (params.useLoTom()) {
        playTom(sound, false, params.loTom(), amplitude);
      }
      break;
    }
    case 38: {
      if (params.useHiTom()) {
        playTom(sound, true, params.hiTom(), amplitude);
      }
      break;
    }
    case 39: {
      if (params.useSnare()) {
        playSnare(sound, params.snare(), amplitude);
      }
      break;
    }
    case 40: {
      if (params.useClap()) {
        playClap(sound, params.clap(), amplitude);
      }
      break;
    }
    case 41: {
      if (params.useClosedHat()) {
        playHat(sound, true, params.closedHat(), amplitude);
      }
      break;
    }
    case 42: {
      if (params.useOpenHat()) {
        playHat(sound, false, params.openHat(), amplitude);
      }
      break;
    }
    };
  }
}

void Drums::drawEditorKeyAxis(
    Lv &lv, love::Font *font, float width, bool highlightKey, int keyPressed) {
  // grey out most of the axis
  lv.graphics.setColor({ 0.8f, 0.8f, 0.8f, 1.0f });
  lv.graphics.rectangle(love::Graphics::DrawMode::DRAW_FILL, 0.0f, -60.0f, width, 120.0f);

  // draw keys where there are drums
  for (auto zero = getZeroKey(), note = zero; note < zero + 12; note++) {
    auto y = ((note - zero) * -1.0f) - 1.0f;
    std::string name;
    bool hasDrum = false;

    switch (note) {
    case 36: {
      if (params.useKick()) {
        hasDrum = true;
        name = "KK";
      }
      break;
    }
    case 37: {
      if (params.useLoTom()) {
        hasDrum = true;
        name = "LT";
      }
      break;
    }
    case 38: {
      if (params.useHiTom()) {
        hasDrum = true;
        name = "HT";
      }
      break;
    }
    case 39: {
      if (params.useSnare()) {
        hasDrum = true;
        name = "SD";
      }
      break;
    }
    case 40: {
      if (params.useClap()) {
        hasDrum = true;
        name = "CP";
      }
      break;
    }
    case 41: {
      if (params.useClosedHat()) {
        hasDrum = true;
        name = "HH";
      }
      break;
    }
    case 42: {
      if (params.useOpenHat()) {
        hasDrum = true;
        name = "OH";
      }
      break;
    }
    }

    if (hasDrum) {
      constexpr auto shittyFontScale = 24.0f / 800.0f;
      lv.graphics.setColor({ 1.0f, 1.0f, 1.0f, 1.0f });
      if (highlightKey && note == keyPressed) {
        lv.graphics.setColor({ 0.8f, 0.0f, 0.0f, 1.0f });
      }
      lv.graphics.rectangle(love::Graphics::DrawMode::DRAW_FILL, 0.0f, y, width, 1.0f);
      lv.graphics.setColor({ 0.0f, 0.0f, 0.0f, 1.0f });
      lv.graphics.rectangle(love::Graphics::DrawMode::DRAW_LINE, 0.0f, y, width, 1.0f);

      lv.graphics.print({ { name, { 1, 1, 1, 1 } } }, font,
          love::Matrix4(0.1f, y + 0.25f, 0, shittyFontScale, shittyFontScale, 0, 0, 0, 0));
    }
  }
}
