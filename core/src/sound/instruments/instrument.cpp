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

void Instrument::drawEditorKeyAxis(
    Lv &lv, love::Font *font, float width, bool highlightKey, int keyPressed) {
  // instrument's zero key is y = 0
  for (auto zero = getZeroKey(), note = zero - 60; note < zero + 36; note++) {
    auto y = ((note - zero) * -1.0f) - 1.0f;
    auto scaleDegree = note % 12;
    auto isBlack = scaleDegree == 1 || scaleDegree == 3 || scaleDegree == 6 || scaleDegree == 8
        || scaleDegree == 10;
    if (isBlack) {
      lv.graphics.setColor({ 0.1f, 0.1f, 0.1f, 1.0f });
    } else {
      lv.graphics.setColor({ 1.0f, 1.0f, 1.0f, 1.0f });
    }
    if (highlightKey && note == keyPressed) {
      lv.graphics.setColor({ 0.8f, 0.0f, 0.0f, 1.0f });
    }
    lv.graphics.rectangle(love::Graphics::DrawMode::DRAW_FILL, 0.0f, y, width, 1.0f);
    lv.graphics.setColor({ 0.0f, 0.0f, 0.0f, 1.0f });
    lv.graphics.rectangle(love::Graphics::DrawMode::DRAW_LINE, 0.0f, y, width, 1.0f);
  }
}
