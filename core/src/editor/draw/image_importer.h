#pragma once

#include "precomp.h"
#include "lv.h"

class ImageImporter {
public:
  ImageImporter() = default;
  ImageImporter(const ImageImporter &) = delete;
  const ImageImporter &operator=(const ImageImporter &) = delete;

  bool isImportingImage = false;
  void importImage(std::string uri);
  void generateImportedImageFilteredPreview(love::image::ImageData *original);
  void reset();
  void draw();

private:
  Lv &lv { Lv::getInstance() };
  std::unique_ptr<love::image::ImageData> importedImageOriginalData;
  std::unique_ptr<love::Image> importedImageFilteredPreview;
};
