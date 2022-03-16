#include "text.h"

#include "behaviors/all.h"
#include "data/fonts.h"


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

void TextBehavior::loadFontResources(Lv &lv) {
  const auto loadFontResource = [&](const std::string &name, auto &xxdData) {
    TextFontResource resource;
    resource.data
        = love::StrongRef<love::Data>(new EmbeddedFontData(xxdData), love::Acquire::NORETAIN);
    fontResources[name] = std::move(resource);
  };

  loadFontResource("Overlay", Overlay_ttf);

  loadFontResource("BreiteGrotesk", BreiteGrotesk_ttf);
  loadFontResource("Compagnon", Compagnon_ttf);
  loadFontResource("Glacier", Glacier_ttf);
  loadFontResource("HelicoCentrica", HelicoCentrica_ttf);
  loadFontResource("Piazzolla", Piazzolla_ttf);
  loadFontResource("YatraOne", YatraOne_ttf);
  loadFontResource("Bore", Bore_ttf);
  loadFontResource("Synco", Synco_ttf);
  loadFontResource("Tektur", Tektur_ttf);
  loadFontResource("Balto", Balto_ttf);
}

void TextBehavior::unloadFontResources() {
  fontResources.clear();
}
