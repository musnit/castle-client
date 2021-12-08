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
  ~ImageImporter();

  enum class Status {
    None,
    Importing,
    Error,
  };
  Status status = Status::None;

  void importImage(std::string uri);
  void generateImportedImageFilteredPreview(love::image::ImageData *original);
  void regeneratePreview();
  love::image::ImageData *getFilteredImageData();
  void reset();
  void update(double dt);
  void draw();

private:
  friend struct ImportImageActionReceiver;

  Lv &lv { Lv::getInstance() };
  DrawTool &drawTool;

  void sendEvent();
  void makePaletteProvider();

  std::unique_ptr<PaletteProvider> palette;
  std::string paletteProviderType = "luminance";
  std::vector<int> paletteColorsUsed;
  std::unordered_map<int, int> paletteOverrides; // hex -> hex
  float imageScale = 1.0f;
  uint8 numBlurs = 1;
  uint8 numColors = 4;
  uint8 minEqualNeighbors = 1;
  bool normalizeRgb = false;

  love::image::ImageData *importedImageOriginalData = nullptr;
  love::image::ImageData *importedImageFilteredData = nullptr;
  love::Image *importedImageFilteredPreview = nullptr;

  class FilterThread : public love::thread::Threadable {
  public:
    FilterThread(ImageImporter *owner_, love::image::ImageData *imageData);
    virtual ~FilterThread() = default;
    void threadFunction();

  private:
    ImageImporter *owner;
    love::image::ImageData *imageData;
  };

  bool loading = false;
  bool hasNewFilteredData = false;
  FilterThread *filterThread = nullptr;
  void imageFilterFinished(love::image::ImageData *data);
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
