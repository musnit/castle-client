#include "song.h"
#include "archive.h"
#include "sound/instruments/sampler.h"
#include "editor/draw/util.h"

std::unique_ptr<Pattern> Song::makeEmptyPattern() {
  static std::random_device rd;
  static uuids::basic_uuid_random_generator gen(rd);
  auto pattern = std::make_unique<Pattern>();
  pattern->patternId = uuids::to_string(gen());
  pattern->color = DrawUtil::getRandomCastlePaletteColor();
  return pattern;
}

std::unique_ptr<Song::Track> Song::makeDefaultTrack() {
  // default sampler
  auto track = std::make_unique<Song::Track>();
  track->instrument = std::make_unique<Sampler>();
  return track;
}

Song::Song(const Song &other) {
  Archive archive;
  archive.write([&](Archive::Writer &w) {
    other.write(w);
  });

  archive.read([&](Archive::Reader &r) {
    read(r);
  });
}

const Song &Song::operator=(const Song &other) {
  Archive archive;
  archive.write([&](Archive::Writer &w) {
    other.write(w);
  });

  archive.read([&](Archive::Reader &r) {
    read(r);
  });

  return *this;
}

Song::Song(Reader &reader) {
  read(reader);
}

void Song::write(Writer &writer) const {
  writer.write("patterns", patterns);
  writer.arr("tracks", [&]() {
    for (auto &track : tracks) {
      writer.obj([&]() {
        writer.write("instrument", track->instrument.get());
        writer.write("sequence", track->sequence);
      });
    }
  });
}

std::string Song::serialize() {
  Archive archive;
  archive.write([&](Archive::Writer &w) {
    write(w);
  });
  return archive.toJson();
}

void Song::read(Reader &reader) {
  tracks.clear();
  patterns.clear();

  reader.obj("patterns", [&]() {
    reader.read(patterns);
  });
  reader.each("tracks", [&]() {
    auto track = std::make_unique<Track>();
    reader.obj("sequence", [&]() {
      reader.read(track->sequence);
    });
    reader.obj("instrument", [&]() {
      track->instrument = Instrument::readVirtual(reader);
    });
    tracks.push_back(std::move(track));
  });
}

double Song::getLength(Clock &clock) {
  double maxLength = 0;
  for (auto &track : tracks) {
    double trackLength = 0;
    if (track->sequence.size() > 0) {
      auto last = track->sequence.rbegin();
      auto lastStartTime = last->first;
      auto lastPatternLength = patterns[last->second].getLoopLength(clock);
      trackLength = lastStartTime + lastPatternLength;
    }
    if (trackLength > maxLength) {
      maxLength = trackLength;
    }
  }
  return maxLength;
}

std::unique_ptr<Pattern> Song::flattenSequence(
    int trackIndex, double startTime, double endTime, Clock &clock) {
  auto result = Song::makeEmptyPattern();

  // lower_bound : Returns an iterator pointing to the first element that is not less than key.
  auto &track = *tracks[trackIndex];
  auto current = track.sequence.lower_bound(startTime);
  double timeInOutput = 0;
  double timeInTrack = startTime;

  if ((current == track.sequence.end() || current->first != startTime)
      && current != track.sequence.begin()) {
    // no pattern starts exactly at the requested time, but we may be partway through the previous
    current = std::prev(current);
  }

  while (current != track.sequence.end()) {
    auto sequenceElemStartTime = current->first;
    auto patternId = current->second;
    auto &pattern = patterns[patternId];
    auto patternLoopLength = pattern.getLoopLength(clock);
    auto next = std::next(current);

    if (timeInOutput == 0) {
      // fast-forward to the very first time this track will make sound
      timeInOutput = sequenceElemStartTime - startTime;
      timeInTrack = sequenceElemStartTime;
      while (timeInTrack < startTime - patternLoopLength) {
        // TODO: possibly start partway through a pattern
        timeInOutput += patternLoopLength;
        timeInTrack += patternLoopLength;
      }
    }

    // figure out how long this pattern loops for
    double sequenceElemEndTime = endTime;
    if (next != track.sequence.end()) {
      // until next pattern or end of the range
      if (next->first < endTime) {
        sequenceElemEndTime = next->first;
      }
    } else if (sequenceElemEndTime <= startTime) {
      // we're the last pattern, no end time specified, so play once and end
      sequenceElemEndTime = timeInTrack + patternLoopLength;
    }

    // bail early if our nearest notes happen after the stream finished
    if (endTime != 0 && timeInTrack >= endTime) {
      break;
    }

    // loop the current pattern until this sequence elem is finished
    while (timeInTrack < sequenceElemEndTime) {
      bool interrupted = false;
      for (auto &[step, notes] : pattern) {
        if (timeInTrack + step >= sequenceElemEndTime) {
          interrupted = true;
          break;
        } else {
          if (timeInOutput + step >= 0) {
            for (auto &note : notes) {
              result->addNote(timeInOutput + step, note.key);
            }
          }
        }
      }
      if (interrupted) {
        timeInOutput += (sequenceElemEndTime - timeInTrack);
        timeInTrack = sequenceElemEndTime;
      } else {
        timeInTrack += patternLoopLength;
        timeInOutput += patternLoopLength;
      }
    }

    if (endTime != 0 && timeInTrack >= endTime) {
      break;
    }
    current++; // move to next sequence elem
  }
  return result;
}
