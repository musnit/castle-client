#include "instrument.h"
#include "sampler.h"
#include "drums.h"

Instrument::Instrument(const Instrument &other) {
  *this = other;
}

const Instrument &Instrument::operator=(const Instrument &other) {
  Archive archive;
  archive.write([&](Archive::Writer &w) {
    other.write(w);
  });


  archive.read([&](Archive::Reader &r) {
    read(r);
  });
  return *this;
}

Instrument::~Instrument() {
}

void Instrument::write(Writer &writer) const {
  writer.write("type", getType());
  writer.write("props", props);
}

void Instrument::read(Reader &reader) {
  reader.obj("props", [&]() {
    reader.read(props);
  });
}

std::unique_ptr<Instrument> Instrument::readVirtual(Reader &reader) {
  auto type = std::string(reader.str("type", "instrument"));
  std::unique_ptr<Instrument> result = nullptr;
  if (type == "sampler") {
    auto sampler = std::make_unique<Sampler>();
    sampler->read(reader);
    result = std::move(sampler);
  } else if (type == "drums") {
    auto drums = std::make_unique<Drums>();
    drums->read(reader);
    result = std::move(drums);
  }
  return result;
}
