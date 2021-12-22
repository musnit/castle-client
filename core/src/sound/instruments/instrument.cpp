#include "instrument.h"

Instrument::Instrument(const Instrument &other) {
  Archive archive;
  archive.write([&](Archive::Writer &w) {
    other.write(w);
  });

  archive.read([&](Archive::Reader &r) {
    read(r);
  });
}

Instrument::~Instrument() {
}

void Instrument::write(Writer &writer) const {
  writer.write("type", getType());
}

void Instrument::read(Reader &reader) {
}
