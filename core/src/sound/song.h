#pragma once

#include "precomp.h"
#include "archive.h"
#include "pattern.h"
#include "instruments/instrument.h"

//
// A Song is a bank of Patterns and a list of Tracks.
//
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

    // Track::Sequence is a mapping from startTime to Pattern.
    // Patterns cannot share the same start time, but they can 'interrupt' the previous one.
    struct SequenceElem {
      PROP(std::string, patternId);
      PROP(bool, loop) = true;
    };
    using Sequence = std::map<double, SequenceElem>;

    Sequence sequence;
  };
  std::vector<std::unique_ptr<Track>> tracks;

  // compose sequence into one long pattern, suitable for scheduling as a stream.
  // startTime and endTime are bounds in the overall song;
  // endTime == 0 indicates to go to the end of the song
  std::unique_ptr<Pattern> flattenSequence(
      int trackIndex, double startTime, double endTime, Clock &clock);

  // run `flattenSequence` for all tracks, normalizing all tracks to the maximum play length
  std::vector<std::unique_ptr<Pattern>> flattenTracksForPlayback(
      double songStartTime, double songEndTime, Clock &clock);

  // compute total song length (max among individual track lengths)
  double getLength(Clock &clock);

  void cleanUpUnusedPatterns();
  double getSequenceElemLength(
      Track::Sequence &sequence, Track::Sequence::iterator &current, Clock &clock);

  static Track::Sequence::iterator sequenceElemAtTime(Track &track, double timeInSong);
  static std::unique_ptr<Track> makeDefaultTrack();
};

inline Song::Track::Sequence::iterator Song::sequenceElemAtTime(
    Song::Track &track, double timeInSong) {
  // lower_bound: returns an iterator pointing to the first element that is not less than key.
  auto result = track.sequence.lower_bound(timeInSong);
  if ((result == track.sequence.end() || result->first != timeInSong)
      && result != track.sequence.begin()) {
    // no sequence starts exactly at the requested time, but we may be partway through the previous
    result = std::prev(result);
  }
  return result;
}
