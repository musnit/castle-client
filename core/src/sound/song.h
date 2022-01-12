#pragma once

#include "precomp.h"
#include "archive.h"
#include "pattern.h"
#include "instruments/instrument.h"

class Song {
public:
  Song() = default;
  Song(const Song &);
  Song(Reader &reader);
  const Song &operator=(const Song &);
  void write(Writer &writer) const;
  void read(Reader &reader);

  struct Track {
    std::unique_ptr<Instrument> instrument;
    Pattern pattern; // TODO: organize and sequence multiple patterns
  };
  std::vector<std::unique_ptr<Track>> tracks;

  static std::unique_ptr<Track> makeDefaultTrack();
};
