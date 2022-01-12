#include "song.h"
#include "archive.h"
#include "sound/instruments/sampler.h"

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
  writer.arr("tracks", [&]() {
    for (auto &track : tracks) {
      writer.obj([&]() {
        writer.write("instrument", track->instrument.get());
        writer.write("pattern", track->pattern);
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
  reader.each("tracks", [&]() {
    auto track = std::make_unique<Track>();
    reader.obj("pattern", [&]() {
      reader.read(track->pattern);
    });
    reader.obj("instrument", [&]() {
      track->instrument = Instrument::readVirtual(reader);
    });
    tracks.push_back(std::move(track));
  });
}
