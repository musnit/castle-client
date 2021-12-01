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

void TextBehavior::loadFontResources() {
  constexpr auto defaultFontSize = 10;

  defaultFont.reset(
      lv.graphics.newDefaultFont(defaultFontSize, love::TrueTypeRasterizer::HINTING_NORMAL));

  const auto loadFontResource = [&](const std::string &name, auto &xxdData) {
    TextFontResource resource;
    resource.data = love::StrongRef<love::Data>(new EmbeddedFontData(xxdData), love::Acquire::NORETAIN);
    fontResources[name] = std::move(resource);
  };

  loadFontResource("3270Condensed Condensed", __3270Condensed_Condensed_ttf);
  loadFontResource("Abibas Medium", Abibas_Medium_ttf);
  loadFontResource("AstralMono Regular", AstralMono_Regular_ttf);
  loadFontResource("Avara Bold", Avara_Bold_ttf);
  loadFontResource("Avara BoldItalic", Avara_BoldItalic_ttf);
  loadFontResource("Betatron Regular", Betatron_Regular_ttf);
  loadFontResource("Blocus Regular", Blocus_Regular_ttf);
  loadFontResource("BreiteGrotesk Regular", BreiteGrotesk_Regular_ttf);
  loadFontResource("Chicagoland Medium", Chicagoland_Medium_ttf);
  loadFontResource("ComicNeue Bold", ComicNeue_Bold_ttf);
  loadFontResource("ComicNeueAngular Bold", ComicNeueAngular_Bold_ttf);
  loadFontResource("Compagnon Bold", Compagnon_Bold_ttf);
  loadFontResource("Compagnon Medium", Compagnon_Medium_ttf);
  loadFontResource("Compagnon Roman", Compagnon_Roman_ttf);
  loadFontResource("DagsenOutline Black", DagsenOutline_Black_ttf);
  loadFontResource("Glacier Bold", Glacier_Bold_ttf);
  loadFontResource("HappyTimesAtTheIKOB Regular", HappyTimesAtTheIKOB_Regular_ttf);
  loadFontResource("HelicoCentrica Roman", HelicoCentrica_Roman_ttf);
  loadFontResource("Norm Medium", Norm_Medium_ttf);
  loadFontResource("Norm Regular", Norm_Regular_ttf);
  loadFontResource("Outward Block", Outward_Block_ttf);
  loadFontResource("Piazzolla Medium", Piazzolla_Medium_ttf);
  loadFontResource("SnapitMono Regular", SnapitMono_Regular_ttf);
  loadFontResource("SpaceGrotesk Regular", SpaceGrotesk_Regular_ttf);
  loadFontResource("StandardGraf Regular", StandardGraf_Regular_ttf);
  loadFontResource("Syne Extra", Syne_Extra_ttf);
  loadFontResource("YatraOne Regular", YatraOne_Regular_ttf);
  loadFontResource("Zarathustra Regular", Zarathustra_Regular_ttf);
}
