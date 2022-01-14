#include "song.h"
#include "archive.h"
#include "sound/instruments/sampler.h"

std::unique_ptr<Pattern> Song::makeEmptyPattern() {
  static std::random_device rd;
  static uuids::basic_uuid_random_generator gen(rd);
  auto pattern = std::make_unique<Pattern>();
  pattern->patternId = uuids::to_string(gen());
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

std::unique_ptr<Pattern> Song::flattenSequence(
    int trackIndex, double startTime, double endTime, Clock &clock) {
  auto result = Song::makeEmptyPattern();

  // lower_bound : Returns an iterator pointing to the first element that is not less than key.
  auto &track = *tracks[trackIndex];
  auto current = track.sequence.lower_bound(startTime);
  double timePassed = 0;
  while (current != track.sequence.end()) {
    auto sequenceElemStartTime = current->first;
    auto patternId = current->second;
    auto &pattern = patterns[patternId];
    auto patternLoopLength = pattern.getLoopLength(clock);
    auto next = std::next(current);

    if (timePassed == 0) {
      timePassed = sequenceElemStartTime - startTime;
    }

    // figure out how long this pattern loops for
    double sequenceElemEndTime = endTime;
    if (next != track.sequence.end()) {
      // until next pattern
      sequenceElemEndTime = next->first;
    } else if (sequenceElemEndTime <= startTime) {
      // we're the last pattern, no end time specified, so play once and end
      sequenceElemEndTime = timePassed + patternLoopLength;
    }

    while (timePassed < sequenceElemEndTime) {
      bool interrupted = false;
      for (auto &[step, notes] : pattern) {
        if (timePassed + step >= sequenceElemEndTime) {
          interrupted = true;
          break;
        } else {
          for (auto &note : notes) {
            result->addNote(timePassed + step, note.key);
          }
        }
      }
      if (interrupted) {
        timePassed = sequenceElemEndTime;
      } else {
        timePassed += patternLoopLength;
      }
    }

    current++;
  }
  return result;
}
