#include "embedded_image.h"
#include "data/images.h"

love::Data *EmbeddedImage::load(const std::string &filename) {
  unsigned char *data = nullptr;
  unsigned int len = 0;

  if (filename == "comment.png") {
    data = comment_png;
    len = comment_png_len;
  } else if (filename == "fire-selected.png") {
    data = fire_selected_png;
    len = fire_selected_png_len;
  } else if (filename == "fire.png") {
    data = fire_png;
    len = fire_png_len;
  } else if (filename == "share-ios.png") {
    data = share_ios_png;
    len = share_ios_png_len;
  } else if (filename == "share-android.png") {
    data = share_android_png;
    len = share_android_png_len;
  } else if (filename == "overflow.png") {
    data = overflow_png;
    len = overflow_png_len;
  } else if (filename == "remix.png") {
    data = remix_png;
    len = remix_png_len;
  } else if (filename == "reload.png") {
    data = reload_png;
    len = reload_png_len;
  } else if (filename == "sound/instrument-drum-white.png") {
    data = sound_instrument_drum_white_png;
    len = sound_instrument_drum_white_png_len;
  } else if (filename == "sound/instrument-drum.png") {
    data = sound_instrument_drum_png;
    len = sound_instrument_drum_png_len;
  } else if (filename == "sound/instrument-file-white.png") {
    data = sound_instrument_file_white_png;
    len = sound_instrument_file_white_png_len;
  } else if (filename == "sound/instrument-file.png") {
    data = sound_instrument_file_png;
    len = sound_instrument_file_png_len;
  } else if (filename == "sound/instrument-recording-white.png") {
    data = sound_instrument_recording_white_png;
    len = sound_instrument_recording_white_png_len;
  } else if (filename == "sound/instrument-recording.png") {
    data = sound_instrument_recording_png;
    len = sound_instrument_recording_png_len;
  } else if (filename == "sound/instrument-sfxr-white.png") {
    data = sound_instrument_sfxr_white_png;
    len = sound_instrument_sfxr_white_png_len;
  } else if (filename == "sound/instrument-sfxr.png") {
    data = sound_instrument_sfxr_png;
    len = sound_instrument_sfxr_png_len;
  } else if (filename == "sound/instrument-tone-white.png") {
    data = sound_instrument_tone_white_png;
    len = sound_instrument_tone_white_png_len;
  } else if (filename == "sound/instrument-tone.png") {
    data = sound_instrument_tone_png;
    len = sound_instrument_tone_png_len;
  } else if (filename == "sound/loop.png") {
    data = sound_loop_png;
    len = sound_loop_png_len;
  }

  if (data) {
    love::data::DataModule *dataModule
        = love::Module::getInstance<love::data::DataModule>(love::Module::M_DATA);
    return dataModule->newByteData(data, len);
  }
  return nullptr;
}
