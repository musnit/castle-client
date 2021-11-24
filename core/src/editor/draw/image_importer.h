#pragma once

#include "precomp.h"
#include "lv.h"
#include "palette_provider.h"

class DrawTool;

class ImageImporter {
public:
  explicit ImageImporter(DrawTool &drawTool_);
  ImageImporter(const ImageImporter &) = delete;
  const ImageImporter &operator=(const ImageImporter &) = delete;

  bool isImportingImage = false;
  void importImage(std::string uri);
  void generateImportedImageFilteredPreview(love::image::ImageData *original);
  void regeneratePreview();
  love::image::ImageData *getFilteredImageData();
  void reset();
  void draw();

private:
  friend struct ImportImageActionReceiver;

  Lv &lv { Lv::getInstance() };
  DrawTool &drawTool;

  void sendEvent();

  std::unique_ptr<PaletteProvider> palette;
  float imageScale = 1.0f;
  uint8 numBlurs = 1;
  uint8 numColors = 4;

  love::image::ImageData *importedImageOriginalData;
  love::image::ImageData *importedImageFilteredData;
  love::Image *importedImageFilteredPreview;
};

inline ImageImporter::ImageImporter(DrawTool &drawTool_)
    : drawTool(drawTool_) {
}

inline love::image::ImageData *ImageImporter::getFilteredImageData() {
  if (!importedImageFilteredPreview) {
    regeneratePreview();
  }
  return importedImageFilteredData;
}
