#include "instrument.h"
#include "sampler.h"
#include "drums.h"
#include "utils/embedded_image.h"

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

void Instrument::drawEditorGridCellColors(
    Lv &lv, unsigned int initialStepIndex, int initialNoteIndex, float width, float height) {
  // darken rows for black keys
  constexpr auto darkGrey = 0xd2 / 255.0f;
  lv.graphics.setColor({ darkGrey, darkGrey, darkGrey, 1.0f });

  int noteIndexVisible = initialNoteIndex;
  float gridY = 0.0f;
  while (gridY < height) {
    int key = getZeroKey() - noteIndexVisible - 1;
    if (isBlack(key % 12)) {
      lv.graphics.rectangle(love::Graphics::DrawMode::DRAW_FILL, 0.0f, gridY, width, 1.0f);
    }
    noteIndexVisible++;
    gridY += 1.0f;
  }
}

void Instrument::drawEditorKeyAxis(
    Lv &lv, love::Font *font, float width, bool highlightKey, int keyPressed) {
  // instrument's zero key is y = 0
  for (auto zero = getZeroKey(), note = zero - 60; note < zero + 36; note++) {
    auto y = ((note - zero) * -1.0f) - 1.0f;
    auto scaleDegree = note % 12;
    if (isBlack(scaleDegree)) {
      constexpr auto darkGrey = 0x55 / 255.0f;
      lv.graphics.setColor({ darkGrey, darkGrey, darkGrey, 1.0f });
    } else {
      constexpr auto lightGrey = 0xee / 255.0f;
      lv.graphics.setColor({ lightGrey, lightGrey, lightGrey, 1.0f });
    }
    if (highlightKey && note == keyPressed) {
      lv.graphics.setColor({ 0.8f, 0.0f, 0.0f, 1.0f });
    }
    lv.graphics.rectangle(love::Graphics::DrawMode::DRAW_FILL, 0.0f, y, width, 1.0f);

    // draw bottom divider if we have two white keys in a row
    if (scaleDegree == 0 || scaleDegree == 5) {
      if (scaleDegree == 0) {
        constexpr auto darkGrey = 0x55 / 255.0f;
        lv.graphics.setColor({ darkGrey, darkGrey, darkGrey, 1.0f });

        // label C's
        auto shittyFontScale = width / 100.0f;
        auto octaveLabel = fmt::format("C{}", (note / 12) - 1); // middle C == C4 == midi 60
        lv.graphics.print({ { octaveLabel, { 1, 1, 1, 1 } } }, font,
            love::Matrix4(0.1f, y + 0.25f, 0, shittyFontScale, shittyFontScale, 0, 0, 0, 0));
      }
      if (scaleDegree == 5) {
        constexpr auto dividerGrey = 0xbb / 255.0f;
        lv.graphics.setColor({ dividerGrey, dividerGrey, dividerGrey, 1.0f });
      }
      lv.graphics.rectangle(love::Graphics::DrawMode::DRAW_FILL, 0.0f, y + 0.95f, width, 0.1f);
    }
  }
}

love::graphics::Image *Instrument::loadEditorIcon(Lv &lv, const std::string &name) {
  if (editorIcons.find(name) == editorIcons.end()) {
    std::string filename = "sound/instrument-" + name + "-white.png";
    auto byteData = EmbeddedImage::load(filename);
    love::image::ImageData *imageData = lv.image.newImageData(byteData);

    love::graphics::Image::Settings settings;
    love::graphics::Image::Slices slices(love::graphics::TEXTURE_2D);
    slices.set(0, 0, imageData);

    love::graphics::Image *image = lv.graphics.newImage(slices, settings);
    love::graphics::Texture::Filter f = image->getFilter();
    f.min = love::graphics::Texture::FILTER_NEAREST;
    f.mag = love::graphics::Texture::FILTER_NEAREST;
    image->setFilter(f);

    editorIcons.emplace(name, image);
  }
  return editorIcons[name];
}

void Instrument::drawEditorIcon(Lv &lv, float width, float height) {
  auto image = Instrument::loadEditorIcon(lv, getEditorIconName());
  static auto quad = [&]() {
    std::vector<love::graphics::Vertex> quadVerts {
      { 0, 0, 0, 0, { 0xff, 0xff, 0xff, 0xff } },
      { 1, 0, 1, 0, { 0xff, 0xff, 0xff, 0xff } },
      { 1, 1, 1, 1, { 0xff, 0xff, 0xff, 0xff } },
      { 0, 1, 0, 1, { 0xff, 0xff, 0xff, 0xff } },
    };
    return lv.graphics.newMesh(
        quadVerts, love::graphics::PRIMITIVE_TRIANGLE_FAN, love::graphics::vertex::USAGE_STATIC);
  }();

  quad->setTexture(image);
  quad->draw(&lv.graphics, love::Matrix4(0, 0, 0, width, height, 0, 0, 0, 0));
}
