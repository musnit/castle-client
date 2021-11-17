#pragma once

#include "precomp.h"
#include "lv.h"

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
  void reset();
  void draw();

private:
  friend struct ImportImageActionReceiver;

  Lv &lv { Lv::getInstance() };
  DrawTool &drawTool;

  void sendEvent();
  void shufflePalette();

  uint8 numBlurs = 1;
  uint8 numColors = 4;

  std::unique_ptr<love::image::ImageData> importedImageOriginalData;
  std::unique_ptr<love::Image> importedImageFilteredPreview;
};

inline ImageImporter::ImageImporter(DrawTool &drawTool_)
    : drawTool(drawTool_) {
}
