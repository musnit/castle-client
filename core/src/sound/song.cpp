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
  writer.write("pattern", pattern);
}

void Song::read(Reader &reader) {
  songId = reader.str("songId", "");
  reader.each([&](const char *key) {
    if (std::string(key) == "pattern") {
      reader.read(pattern);
    }
  });
}
