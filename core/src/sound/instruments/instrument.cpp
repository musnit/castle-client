#include "instrument.h"
#include "sampler.h"

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

std::unique_ptr<Instrument> Instrument::readVirtual(Reader &reader) {
  auto type = std::string(reader.str("type", "instrument"));
  if (type == "sampler") {
    auto sampler = std::make_unique<Sampler>();
    sampler->read(reader);
    return sampler;
  }
  return nullptr;
}
