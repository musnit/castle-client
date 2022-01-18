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
  std::string serialize();

  // bank of all patterns used in this song; patternId -> Pattern
  std::unordered_map<std::string, Pattern> patterns;

  // a Track is an Instrument that plays sounds, and a sequence of Patterns from the song's pattern
  // bank.
  struct Track {
    std::unique_ptr<Instrument> instrument;

    struct SequenceElem {
      PROP(std::string, patternId);
      PROP(bool, loop) = true;
    };

    // startTime -> SequenceElem
    std::map<double, SequenceElem> sequence;
  };
  std::vector<std::unique_ptr<Track>> tracks;

  // compose sequence into one long pattern, suitable for scheduling as a stream.
  // startTime and endTime are bounds in the overall song;
  // endTime == 0 indicates to go to the end of the song
  std::unique_ptr<Pattern> flattenSequence(
      int trackIndex, double startTime, double endTime, Clock &clock);

  // compute total song length (max among individual track lengths)
  double getLength(Clock &clock);

  static std::unique_ptr<Pattern> makeEmptyPattern();
  static std::unique_ptr<Track> makeDefaultTrack();
};
