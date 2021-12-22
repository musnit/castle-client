#pragma once

#include "precomp.h"
#include "archive.h"
#include "pattern.h"
#include "instruments/instrument.h"

class Song {
public:
  Song() = default;
  inline Song(std::string songId_)
      : songId(songId_) {
  }
  Song(const Song &);
  const Song &operator=(const Song &) = delete;
  void write(Writer &writer) const;
  void read(Reader &reader);

  // TODO: name / some creator-facing way to reference songs
  std::string songId;

  // TODO: organize multiple sounds and patterns
  std::vector<std::unique_ptr<Instrument>> instruments;
  Pattern pattern;
};
