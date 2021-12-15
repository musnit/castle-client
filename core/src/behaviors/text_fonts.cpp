#include "text.h"

#include "behaviors/all.h"


struct EmbeddedFontData : love::Data {
  unsigned char *data;
  int size;

  template<int N>
  explicit EmbeddedFontData(unsigned char (&xxdData)[N])
      : data(xxdData)
      , size(sizeof(xxdData)) {
  }

  EmbeddedFontData(unsigned char *data_, int size_)
      : data(data_)
      , size(size_) {
  }

  Data *clone() const override {
    return new EmbeddedFontData(data, size);
  }

  void *getData() const override {
    return data;
  }

  size_t getSize() const override {
    return size;
  }
};

namespace CastleCore {
const char *getAssetsDirectoryPath();
}

#ifndef LOVE_IOS
namespace CastleCore {
const char *getAssetsDirectoryPath() {
  return "assets/";
}
}
#endif

void TextBehavior::loadFontResources() {
  const auto loadFontResource = [&](const std::string &name) {
    TextFontResource resource;
    auto fullPath = CastleCore::getAssetsDirectoryPath() + std::string("/") + name + ".ttf";
    resource.data = love::StrongRef<love::Data>(
        lv.filesystem.read(fullPath.c_str()), love::Acquire::NORETAIN);
    fontResources[name] = std::move(resource);
  };

  loadFontResource("Overlay");
  overlayFont = getFont(&fontResources["Overlay"], 40);

  loadFontResource("Twemoji");
  loadFontResource("OpenSansEmoji");
  loadFontResource("3270Condensed-Condensed");
  loadFontResource("Abibas-Medium");
  loadFontResource("AstralMono-Regular");
  loadFontResource("Avara-Bold");
  loadFontResource("Avara-BoldItalic");
  loadFontResource("Betatron-Regular");
  loadFontResource("Blocus-Regular");
  loadFontResource("BreiteGrotesk-Regular");
  loadFontResource("Chicagoland-Medium");
  loadFontResource("ComicNeue-Bold");
  loadFontResource("ComicNeueAngular-Bold");
  loadFontResource("Compagnon-Bold");
  loadFontResource("Compagnon-Medium");
  loadFontResource("Compagnon-Roman");
  loadFontResource("DagsenOutline-Black");
  loadFontResource("Glacier-Bold");
  loadFontResource("HappyTimesAtTheIKOB-Regular");
  loadFontResource("HelicoCentrica-Roman");
  loadFontResource("Norm-Medium");
  loadFontResource("Norm-Regular");
  loadFontResource("Outward-Block");
  loadFontResource("Piazzolla-Medium");
  loadFontResource("SnapitMono-Regular");
  loadFontResource("SpaceGrotesk-Regular");
  loadFontResource("StandardGraf-Regular");
  loadFontResource("Syne-Extra");
  loadFontResource("YatraOne-Regular");
  loadFontResource("Zarathustra-Regular");
}
