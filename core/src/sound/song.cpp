#include "song.h"
#include "archive.h"

Song::Song(const Song &other) {
  Archive archive;
  archive.write([&](Archive::Writer &w) {
    other.write(w);
  });

  archive.read([&](Archive::Reader &r) {
    read(r);
  });
}

void Song::write(Writer &writer) const {
  writer.write("songId", songId);
  writer.arr("tracks", [&]() {
    for (auto &track : tracks) {
      // TODO: instrument
      writer.write("pattern", track->pattern);
    }
  });
}

void Song::read(Reader &reader) {
  songId = reader.str("songId", "");
  reader.each("tracks", [&]() {
    auto track = std::make_unique<Track>();
    reader.each([&](const char *key) {
      if (std::string(key) == "pattern") {
        // TODO: instrument
        reader.read(track->pattern);
      }
    });
    tracks.push_back(std::move(track));
  });
}
