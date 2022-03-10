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
  {
    // techno
    std::string instrument
        = "{\"type\":\"drums\",\"props\":{\"name\":\"techno\",\"muted\":false,\"volume\":1},"
          "\"params\":{\"useKick\":true,\"kick\":{\"decay\":0.35258930921554565,\"punch\":0."
          "8999999761581421,\"freq\":60.42857360839844,\"sweep\":0.7017857432365417},"
          "\"useClosedHat\":true,\"closedHat\":{\"decay\":0.10000000149011612,\"freq\":0."
          "9196428060531616,\"body\":0.4107142686843872},\"useOpenHat\":true,\"openHat\":{"
          "\"decay\":0.18839286267757416,\"freq\":0.8999999761581421,\"body\":0.6071428656578064},"
          "\"useSnare\":true,\"snare\":{\"decay\":0.2135714292526245,\"freq\":0.5874999761581421,"
          "\"tambre\":0.19821427762508392},\"useClap\":false,\"useHiTom\":true,\"hiTom\":{"
          "\"decay\":0.2953571379184723,\"freq\":0.6464285850524902},\"useLoTom\":true,\"loTom\":{"
          "\"decay\":0.31785711646080017,\"freq\":0.14999999105930328}}}";
    std::string notes
        = "{\"0.000000\":[{\"key\":36},{\"key\":41}],\"1.000000\":[{\"key\":41,\"vel\":70}],\"2."
          "000000\":[{\"key\":42}],\"4.000000\":[{\"key\":36},{\"key\":39},{\"key\":41}],\"6."
          "000000\":[{\"key\":42}],\"7.000000\":[{\"key\":41,\"vel\":77}],\"8.000000\":[{\"key\":"
          "36}],\"9.000000\":[{\"key\":41,\"vel\":89}],\"10.000000\":[{\"key\":42}],\"12.000000\":["
          "{\"key\":36},{\"key\":39},{\"key\":41}],\"14.000000\":[{\"key\":42}],\"16.000000\":[{"
          "\"key\":36}],\"17.000000\":[{\"key\":41}],\"18.000000\":[{\"key\":42}],\"20.000000\":[{"
          "\"key\":39},{\"key\":36},{\"key\":41}],\"22.000000\":[{\"key\":42}],\"23.000000\":[{"
          "\"key\":41,\"vel\":60}],\"24.000000\":[{\"key\":36}],\"25.000000\":[{\"key\":41,\"vel\":"
          "78}],\"26.000000\":[{\"key\":42}],\"28.000000\":[{\"key\":39},{\"key\":36},{\"key\":41}]"
          ",\"29.000000\":[{\"key\":38}],\"30.000000\":[{\"key\":42},{\"key\":37}]}";
    presets.emplace("techno", TrackPreset("drums", instrument, notes));
  }
  {
    // techno2
    std::string instrument
        = "{\"type\":\"drums\",\"props\":{\"name\":\"techno2\",\"muted\":false,\"volume\":1},"
          "\"params\":{\"useKick\":true,\"kick\":{\"decay\":0.5850000381469727,\"punch\":0."
          "8999999761581421,\"freq\":62.000003814697266,\"sweep\":0.6000000238418579},"
          "\"useClosedHat\":true,\"closedHat\":{\"decay\":0.10000000149011612,\"freq\":0."
          "8999999761581421,\"body\":0.10000000149011612},\"useOpenHat\":true,\"openHat\":{"
          "\"decay\":0.22589285671710968,\"freq\":0.8999999761581421,\"body\":0.10000000149011612},"
          "\"useSnare\":true,\"snare\":{\"decay\":0.20000000298023224,\"freq\":0.5,\"tambre\":0.5},"
          "\"useClap\":true,\"clap\":{\"decay\":0.34464284777641296,\"freq\":0.6214285492897034},"
          "\"useHiTom\":false,\"useLoTom\":false}}";
    std::string notes
        = "{\"0.000000\":[{\"key\":36}],\"1.000000\":[{\"key\":41}],\"2.000000\":[{\"key\":42}],"
          "\"3.000000\":[{\"key\":41}],\"4.000000\":[{\"key\":40,\"vel\":86},{\"key\":39},{\"key\":"
          "36}],\"5.000000\":[{\"key\":41}],\"6.000000\":[{\"key\":42}],\"7.000000\":[{\"key\":41},"
          "{\"key\":39,\"vel\":91}],\"8.000000\":[{\"key\":36}],\"9.000000\":[{\"key\":41}],\"10."
          "000000\":[{\"key\":42}],\"11.000000\":[{\"key\":41}],\"12.000000\":[{\"key\":36},{"
          "\"key\":39},{\"key\":40,\"vel\":88}],\"13.000000\":[{\"key\":41}],\"14.000000\":[{"
          "\"key\":42}],\"15.000000\":[{\"key\":41}],\"16.000000\":[{\"key\":36}],\"17.000000\":[{"
          "\"key\":41}],\"18.000000\":[{\"key\":42}],\"19.000000\":[{\"key\":41}],\"20.000000\":[{"
          "\"key\":36},{\"key\":39},{\"key\":40,\"vel\":86}],\"21.000000\":[{\"key\":41}],\"22."
          "000000\":[{\"key\":42}],\"23.000000\":[{\"key\":41},{\"key\":39,\"vel\":84}],\"24."
          "000000\":[{\"key\":36}],\"25.000000\":[{\"key\":41}],\"26.000000\":[{\"key\":42},{"
          "\"key\":39,\"vel\":69}],\"27.000000\":[{\"key\":41}],\"28.000000\":[{\"key\":36},{"
          "\"key\":39},{\"key\":40,\"vel\":85}],\"29.000000\":[{\"key\":41}],\"30.000000\":[{"
          "\"key\":42},{\"key\":39,\"vel\":84}],\"31.000000\":[{\"key\":41},{\"key\":39,\"vel\":63}"
          "]}";
    presets.emplace("techno2", TrackPreset("drums", instrument, notes));
  }
  {
    // slow
    std::string instrument
        = "{\"type\":\"drums\",\"props\":{\"name\":\"slow\",\"muted\":false,\"volume\":1},"
          "\"params\":{\"useKick\":true,\"kick\":{\"decay\":0.6816964149475098,\"punch\":0,"
          "\"freq\":51.71,\"sweep\":0.16},\"useClosedHat\":true,\"closedHat\":{\"decay\":0."
          "10000000149011612,\"freq\":1,\"body\":0.10000000149011612},\"useOpenHat\":false,"
          "\"useSnare\":true,\"snare\":{\"decay\":0.334285706281662,\"freq\":0.5,\"tambre\":0."
          "3499999940395355},\"useClap\":false,\"useHiTom\":false,\"useLoTom\":true,\"loTom\":{"
          "\"decay\":0.12017858028411865,\"freq\":0.2767857015132904}}}";
    std::string notes
        = "{\"0.000000\":[{\"key\":36},{\"key\":37}],\"6.000000\":[{\"key\":36},{\"key\":37}],\"8."
          "000000\":[{\"key\":39},{\"key\":41}],\"9.000000\":[{\"key\":41}],\"10.000000\":[{"
          "\"key\":41}],\"12.000000\":[{\"key\":41}],\"14.000000\":[{\"key\":41}],\"16.000000\":[{"
          "\"key\":36},{\"key\":37}],\"22.000000\":[{\"key\":36},{\"key\":37}],\"24.000000\":[{"
          "\"key\":39},{\"key\":41}],\"26.000000\":[{\"key\":36},{\"key\":37,\"vel\":49}],\"27."
          "000000\":[{\"key\":41,\"vel\":68}],\"29.000000\":[{\"key\":41}],\"30.000000\":[{\"key\":"
          "41}],\"31.000000\":[{\"key\":41}]}";
    presets.emplace("slow", TrackPreset("drums", instrument, notes));
  }
  {
    // dnb
    std::string instrument
        = "{\"type\":\"drums\",\"props\":{\"name\":\"dnb\",\"muted\":false,\"volume\":1},"
          "\"params\":{\"useKick\":true,\"kick\":{\"decay\":0.30000001192092896,\"punch\":1,"
          "\"freq\":80,\"sweep\":0.7446428537368774},\"useClosedHat\":true,\"closedHat\":{"
          "\"decay\":0.10000000149011612,\"freq\":0.8999999761581421,\"body\":0.10000000149011612},"
          "\"useOpenHat\":false,\"useSnare\":true,\"snare\":{\"decay\":0.20000000298023224,"
          "\"freq\":0.7017857432365417,\"tambre\":0.30714285373687744},\"useClap\":false,"
          "\"useHiTom\":false,\"useLoTom\":false}}";
    std::string notes
        = "{\"0.000000\":[{\"key\":41},{\"key\":36}],\"2.000000\":[{\"key\":41}],\"4.000000\":[{"
          "\"key\":41},{\"key\":39}],\"6.000000\":[{\"key\":41}],\"8.000000\":[{\"key\":41}],\"10."
          "000000\":[{\"key\":41},{\"key\":36}],\"12.000000\":[{\"key\":41},{\"key\":39}],\"14."
          "000000\":[{\"key\":41}],\"16.000000\":[{\"key\":36},{\"key\":41}],\"18.000000\":[{"
          "\"key\":41}],\"20.000000\":[{\"key\":41},{\"key\":39}],\"22.000000\":[{\"key\":41},{"
          "\"key\":36}],\"24.000000\":[{\"key\":41}],\"26.000000\":[{\"key\":41},{\"key\":39}],"
          "\"28.000000\":[{\"key\":41}],\"29.000000\":[{\"key\":39}],\"30.000000\":[{\"key\":41},{"
          "\"key\":39,\"vel\":35}],\"31.000000\":[{\"key\":39,\"vel\":73}]}";
    presets.emplace("dnb", TrackPreset("drums", instrument, notes));
  }
}
