#include "track_preset.h"

TrackPreset::TrackPreset(
    const std::string &type_, const std::string &instrumentJson_, const std::string &notesJson_)
    : type(type_)
    , instrumentJson(instrumentJson_)
    , notesJson(notesJson_) {
}

TrackPreset &TrackPreset::get(const std::string &name) {
  if (!loaded) {
    loadPresets();
  }
  if (auto found = presets.find(name); found != presets.end()) {
    return found->second;
  } else {
    static TrackPreset empty;
    return empty;
  }
}

void TrackPreset::loadPresets() {
  loaded = true;

  // Drums
  {
    // simple beat
    std::string instrument
        = "{\"type\":\"drums\",\"props\":{\"name\":\"simple "
          "beat\",\"muted\":false,\"volume\":1},\"params\":{\"useKick\":true,\"kick\":{\"decay\":0."
          "28812500834465027,\"punch\":0.8678571581840515,\"freq\":71.28571319580078,\"sweep\":1},"
          "\"useClosedHat\":true,\"closedHat\":{\"decay\":0.11821428686380386,\"freq\":0."
          "5794642567634583,\"body\":0.10000000149011612},\"useOpenHat\":false,\"useSnare\":true,"
          "\"snare\":{\"decay\":0.28357142210006714,\"freq\":0.4124999940395355,\"tambre\":0."
          "3517857491970062},\"useClap\":false,\"useHiTom\":false,\"useLoTom\":false}}";
    std::string notes
        = "{\"0.000000\":[{\"key\":36},{\"key\":41}],\"2.000000\":[{\"key\":41,\"vel\":85}],\"4."
          "000000\":[{\"key\":39,\"vel\":83},{\"key\":41,\"vel\":85}],\"6.000000\":[{\"key\":41,"
          "\"vel\":82}],\"8.000000\":[{\"key\":36},{\"key\":41,\"vel\":99}],\"10.000000\":[{"
          "\"key\":41,\"vel\":88}],\"12.000000\":[{\"key\":39,\"vel\":79},{\"key\":41}],\"14."
          "000000\":[{\"key\":41,\"vel\":88}]}";
    presets.emplace("simple beat", TrackPreset("drums", instrument, notes));
  }
}
