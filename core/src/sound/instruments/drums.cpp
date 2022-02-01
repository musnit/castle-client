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

    // base kick freq
    source->mParams.p_base_freq = SoundUtil::hzToSfxrFreq(kick.freq(), source->mBaseSamplerate);

    // sfxr freq ramp is -1 to 1, we want zero (no sweep) to some negative ramp (more sweep)
    source->mParams.p_freq_ramp = kick.sweep() * -0.3f;
    source->mParams.p_freq_limit = SoundUtil::hzToSfxrFreq(20.0f, source->mBaseSamplerate);
  });

  sound.playSfxr(kickKey, amplitude);
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

  sound.getOrMakeSfxrSourceForKey(snareKey, [&](SoLoud::Sfxr *source) {
    // noise
    source->mParams.wave_type = 3;
    source->mParams.sound_vol = 0.75f;

    // decay, plus some built in sustain and punch
    source->mParams.p_env_decay = snare.decay();
    source->mParams.p_env_sustain = 0.05f;
    source->mParams.p_env_punch = 0.77f;

    // noise freq. built in vibrato
    source->mParams.p_base_freq = 0.1f + snare.freq() * 0.1f;
    source->mParams.p_vib_strength = 0.66f;
    source->mParams.p_vib_speed = 0.1f;

    // built in bandpass
    source->mParams.filter_on = true;
    source->mParams.p_lpf_freq = 0.66f;
    source->mParams.p_lpf_resonance = 0.5f;
    source->mParams.p_hpf_freq = 0.18f;
    source->mParams.p_hpf_ramp = 0.06f;

    // tambre affects phaser
    source->mParams.p_pha_offset = snare.tambre() * 0.2f;
    source->mParams.p_pha_ramp = -0.05f + snare.tambre() * -0.05f;
  });

  sound.playSfxr(snareKey, amplitude);
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
    case 39: {
      if (params.useSnare()) {
        playSnare(sound, params.snare(), amplitude);
      }
      break;
    }
    case 40: {
      if (params.useClosedHat()) {
        playHat(sound, true, params.closedHat(), amplitude);
      }
      break;
    }
    case 41: {
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
    case 39: {
      if (params.useSnare()) {
        hasDrum = true;
        name = "SD";
      }
      break;
    }
    case 40: {
      if (params.useClosedHat()) {
        hasDrum = true;
        name = "HH";
      }
      break;
    }
    case 41: {
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
