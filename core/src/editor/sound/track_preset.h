#pragma once

#include "precomp.h"

class TrackPreset {
public:
  std::string type;
  std::string instrumentJson;
  std::string notesJson;

  static TrackPreset &get(const std::string &name);

private:
  inline static std::unordered_map<std::string, TrackPreset> presets;
  inline static bool loaded = false;
  static void loadPresets();

  TrackPreset() = default;
  TrackPreset(
      const std::string &type, const std::string &instrumentJson, const std::string &notesJson);
};
