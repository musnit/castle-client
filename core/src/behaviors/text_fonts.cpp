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

void TextBehavior::loadFonts() {
  constexpr auto defaultFontSize = 10;

  defaultFont.reset(
      lv.graphics.newDefaultFont(defaultFontSize, love::TrueTypeRasterizer::HINTING_NORMAL));

  const auto loadFont = [&](const std::string &name, auto &xxdData) {
    love::StrongRef data(new EmbeddedFontData(xxdData), love::Acquire::NORETAIN);
    love::StrongRef rasterizer(lv.font.newTrueTypeRasterizer(
                                   data, defaultFontSize, love::TrueTypeRasterizer::HINTING_NORMAL),
        love::Acquire::NORETAIN);
    fonts[name] = std::unique_ptr<love::Font>(lv.graphics.newFont(rasterizer));
  };

  loadFont("3270Condensed Condensed", __3270Condensed_Condensed_ttf);
  loadFont("Abibas Medium", Abibas_Medium_ttf);
  loadFont("AstralMono Regular", AstralMono_Regular_ttf);
  loadFont("Avara Bold", Avara_Bold_ttf);
  loadFont("Avara BoldItalic", Avara_BoldItalic_ttf);
  loadFont("Betatron Regular", Betatron_Regular_ttf);
  loadFont("Blocus Regular", Blocus_Regular_ttf);
  loadFont("BreiteGrotesk Regular", BreiteGrotesk_Regular_ttf);
  loadFont("Chicagoland Medium", Chicagoland_Medium_ttf);
  loadFont("ComicNeue Bold", ComicNeue_Bold_ttf);
  loadFont("ComicNeueAngular Bold", ComicNeueAngular_Bold_ttf);
  loadFont("Compagnon Bold", Compagnon_Bold_ttf);
  loadFont("Compagnon Medium", Compagnon_Medium_ttf);
  loadFont("Compagnon Roman", Compagnon_Roman_ttf);
  loadFont("DagsenOutline Black", DagsenOutline_Black_ttf);
  loadFont("Glacier Bold", Glacier_Bold_ttf);
  loadFont("HappyTimesAtTheIKOB Regular", HappyTimesAtTheIKOB_Regular_ttf);
  loadFont("HelicoCentrica Roman", HelicoCentrica_Roman_ttf);
  loadFont("Norm Medium", Norm_Medium_ttf);
  loadFont("Norm Regular", Norm_Regular_ttf);
  loadFont("Outward Block", Outward_Block_ttf);
  loadFont("Piazzolla Medium", Piazzolla_Medium_ttf);
  loadFont("SnapitMono Regular", SnapitMono_Regular_ttf);
  loadFont("SpaceGrotesk Regular", SpaceGrotesk_Regular_ttf);
  loadFont("StandardGraf Regular", StandardGraf_Regular_ttf);
  loadFont("Syne Extra", Syne_Extra_ttf);
  loadFont("YatraOne Regular", YatraOne_Regular_ttf);
  loadFont("Zarathustra Regular", Zarathustra_Regular_ttf);
}
