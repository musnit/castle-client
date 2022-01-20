#include "song.h"
#include "archive.h"
#include "sound/instruments/sampler.h"

#include <unordered_set>

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
      auto lastPatternLength = patterns[last->second.patternId()].getLoopLength(clock);
      trackLength = lastStartTime + lastPatternLength;
    }
    if (trackLength > maxLength) {
      maxLength = trackLength;
    }
  }
  return maxLength;
}

void Song::cleanUpUnusedPatterns() {
  std::unordered_set<std::string> patternIdFound;
  for (auto &track : tracks) {
    for (auto &[time, sequenceElem] : track->sequence) {
      patternIdFound.emplace(sequenceElem.patternId());
    }
  }
  for (auto it = patterns.begin(); it != patterns.end();) {
    auto const &[patternId, _] = *it;
    if (patternIdFound.find(patternId) != patternIdFound.end()) {
      ++it;
    } else {
      it = patterns.erase(it);
    }
  }
}

std::unique_ptr<Pattern> Song::flattenSequence(
    int trackIndex, double startTime, double endTime, Clock &clock) {
  auto result = Pattern::makeEmptyPattern();

  auto &track = *tracks[trackIndex];
  auto current = Song::sequenceElemAtTime(track, startTime);
  double timeInOutput = 0;
  double timeInTrack = startTime;

  while (current != track.sequence.end()) {
    auto sequenceElemStartTime = current->first;
    auto patternId = current->second.patternId();
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

    // figure out how long until next sequence (or end of song)
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

    // figure out how long to actually write this pattern's notes
    double patternLoopEndTime = sequenceElemEndTime;
    if (!current->second.loop()) {
      patternLoopEndTime = timeInTrack + patternLoopLength;
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
          if (timeInOutput + step >= 0 && timeInTrack + step < patternLoopEndTime) {
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

std::vector<std::unique_ptr<Pattern>> Song::flattenTracksForPlayback(
    double songStartTime, double songEndTime, Clock &clock) {
  std::vector<std::unique_ptr<Pattern>> patterns;
  for (size_t idx = 0; idx < tracks.size(); idx++) {
    auto pattern = flattenSequence(idx, songStartTime, songEndTime, clock);

    // loop all tracks to full selection length (needed if a track ends with silence)
    pattern->loop = Pattern::Loop::ExplicitLength;
    pattern->loopLength = songEndTime - songStartTime;

    patterns.push_back(std::move(pattern));
  }
  return patterns;
}
