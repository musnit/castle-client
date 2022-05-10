#include "image_importer.h"
#include "image_processing.h"
#include "engine.h"
#include "editor/editor.h"
#include "draw_tool.h"

int getMaxImageSize() {
  auto defaultFillPixelsPerUnit = 25.6f;
  auto maxImageSize = DRAW_MAX_SIZE * 2.0f * defaultFillPixelsPerUnit;
  return int(maxImageSize);
}

ImageImporter::FilterThread::FilterThread(ImageImporter *owner_, love::image::ImageData *imageData_)
    : owner(owner_) {
  threadName = "ImageImporterFilter";
  imageData = imageData_;
}

void ImageImporter::FilterThread::threadFunction() {
  if (imageData && owner) {
    if (owner->normalizeRgb) {
      ImageProcessing::normalizeRgb(imageData);
    }
    for (uint8 ii = 0; ii < owner->numBlurs; ii++) {
      ImageProcessing::gaussianBlur(imageData);
    }
    ImageProcessing::kMeans(imageData, owner->numColors, 4);
    ImageProcessing::removeIslands(imageData, owner->minEqualNeighbors);
    ImageProcessing::paletteSwap(
        imageData, *(owner->palette), owner->paletteColorsUsed, owner->paletteOverrides);
    // ImageProcessing::testOnlyRedChannel(imageData);

    owner->imageFilterFinished(imageData);
    imageData = nullptr;
  }
}

ImageImporter::~ImageImporter() {
  reset();
}

void ImageImporter::reset() {
  if (filterThread) {
    filterThread->wait();
    filterThread->release();
    filterThread = nullptr;
  }
  if (importedImageOriginalData) {
    importedImageOriginalData->release();
    importedImageOriginalData = nullptr;
  }
  if (importedImageFilteredData) {
    importedImageFilteredData->release();
    importedImageFilteredData = nullptr;
  }
  if (importedImageFilteredPreview) {
    importedImageFilteredPreview->release();
    importedImageFilteredPreview = nullptr;
  }
  loading = false;
  status = Status::None;
  numBlurs = 1;
  numColors = 4;
  imageScale = 1.0f;
  paletteProviderType = "luminance";
  minEqualNeighbors = 1;
  normalizeRgb = false;
  paletteOverrides.clear();
}

void ImageImporter::importImage(std::string uri) {
// web has the -fno-exceptions flag so the try/catch here doesn't compile
#ifndef __EMSCRIPTEN__
  // if uri begins with `file://` then physfs will reject it
  if (uri.rfind("file://", 0) == 0) {
    uri = uri.substr(7);
  }

  // decode original data and downsize, generate initial preview
  love::filesystem::File *file = lv.filesystem.newFile(uri.c_str());
  love::filesystem::FileData *data = file->read();
  love::image::ImageData *imageData = nullptr;
  try {
    imageData = new love::image::ImageData(data);
  } catch (const love::Exception &e) {
    // most likely love couldn't decode the image
    status = Status::Error;
    sendEvent();
    return;
  }
  file->release();
  if (imageData) {
    imageData = ImageProcessing::fitToMaxSize(imageData, getMaxImageSize());
    if (importedImageOriginalData) {
      importedImageOriginalData->release();
      importedImageOriginalData = nullptr;
    }
    importedImageOriginalData = imageData;
    regeneratePreview();

    status = Status::Importing;
    sendEvent();
  }
#endif
}

void ImageImporter::regeneratePreview() {
  if (importedImageOriginalData) {
    generateImportedImageFilteredPreview(importedImageOriginalData);
  }
}

void ImageImporter::makePaletteProvider() {
  if (paletteProviderType == "luminance") {
    palette = std::make_unique<SimilarLuminancePaletteProvider>();
  } else {
    palette = std::make_unique<RandomPaletteProvider>();
  }
}

void ImageImporter::generateImportedImageFilteredPreview(love::image::ImageData *original) {
  if (!original) {
    return;
  }

  if (!palette) {
    makePaletteProvider();
  }
  palette->reset();

  if (filterThread) {
    filterThread->wait();
    filterThread->release();
    filterThread = nullptr;
  }

  auto imageData = original->clone();
  if (imageScale < 1.0f && imageScale > 0.0f) {
    auto resizeImageData
        = ImageProcessing::fitToMaxSize(imageData, int(float(getMaxImageSize()) * imageScale));
    imageData->release();
    imageData = resizeImageData;
  }

  filterThread = new FilterThread(this, imageData);
  filterThread->start();
  loading = true;
  sendEvent();
}

void ImageImporter::imageFilterFinished(love::image::ImageData *imageData) {
  love::thread::Lock lock(imageFilteredDataMutex);
  if (importedImageFilteredData) {
    importedImageFilteredData->release();
    importedImageFilteredData = nullptr;
  }
  importedImageFilteredData = imageData;
  hasNewFilteredData = true;
}

//
// Events
//

struct ImageImporterEvent {
  PROP(std::string, status) = "none";
  PROP(bool, loading) = false;
  PROP(int, numColors);
  PROP(int, numBlurs);
  PROP(float, imageScale);
  PROP(int, minEqualNeighbors);
  PROP(bool, normalizeRgb);
  PROP(std::vector<int>, paletteColorsUsed);
  PROP((std::unordered_map<int, int>), paletteOverrides);
};

void ImageImporter::sendEvent() {
  ImageImporterEvent ev;
  switch (status) {
  case Status::Importing:
    ev.status() = "importing";
    break;
  case Status::Error:
    ev.status() = "error";
    break;
  case Status::None:
  default:
    ev.status() = "none";
    break;
  }
  ev.loading() = loading;
  ev.numColors() = numColors;
  ev.numBlurs() = numBlurs;
  ev.imageScale() = imageScale;
  ev.minEqualNeighbors() = minEqualNeighbors;
  ev.normalizeRgb() = normalizeRgb;
  ev.paletteColorsUsed() = paletteColorsUsed;
  ev.paletteOverrides() = paletteOverrides;
  drawTool.editor.getBridge().sendEvent("EDITOR_IMPORT_IMAGE", ev);
}

struct ImportImageActionReceiver {
  inline static const BridgeRegistration<ImportImageActionReceiver> registration {
    "IMPORT_IMAGE_ACTION"
  };

  struct Params {
    PROP(std::string, action);
    PROP(double, value);
    PROP((std::array<double, 2>), valuePair);
  } params;

  void receive(Engine &engine) {
    auto editor = engine.maybeGetEditor();
    if (!editor)
      return;

    auto &importer = editor->drawTool.imageImporter;
    auto action = params.action();

    if (action == "setNumColors") {
      auto value = uint8(params.value());
      if (value < 2) {
        value = 2;
      }
      if (value > 8) {
        value = 8;
      }
      importer.numColors = value;
      importer.regeneratePreview();
      // TODO: maybe clear palette overrides here?
      // importer.paletteOverrides.clear();
      importer.sendEvent();
    } else if (action == "setNumBlurs") {
      auto value = uint8(params.value());
      if (value < 0) {
        value = 0;
      }
      if (value > 3) {
        value = 3;
      }
      importer.numBlurs = value;
      importer.regeneratePreview();
      importer.sendEvent();
    } else if (action == "setImageScale") {
      auto value = float(params.value());
      if (value <= 0.0f) {
        value = 0.05f;
      }
      if (value > 1.0f) {
        value = 1.0f;
      }
      importer.imageScale = value;
      importer.regeneratePreview();
      importer.sendEvent();
    } else if (action == "setNormalizeRgb") {
      auto value = int(params.value());
      importer.normalizeRgb = value == 1 ? true : false;
      importer.regeneratePreview();
      importer.sendEvent();
    } else if (action == "setMinEqualNeighbors") {
      auto value = int(params.value());
      if (value <= 0) {
        value = 0;
      }
      if (value > 3) {
        value = 3;
      }
      importer.minEqualNeighbors = value;
      importer.regeneratePreview();
      importer.sendEvent();
    } else if (action == "swapColors") {
      int providerType = int(params.value());
      std::string oldProviderType = importer.paletteProviderType;
      if (providerType == 0) {
        importer.paletteProviderType = "random";
      } else if (providerType == 1) {
        importer.paletteProviderType = "luminance";
      }
      if (oldProviderType != importer.paletteProviderType) {
        importer.makePaletteProvider();
      }
      importer.palette->init();
      importer.paletteOverrides.clear();
      importer.regeneratePreview();
    } else if (action == "overrideColor") {
      auto valuePair = params.valuePair();
      int fromColor = int(valuePair[0]);
      int toColor = int(valuePair[1]);
      importer.paletteOverrides[fromColor] = toColor;
      importer.regeneratePreview();
      importer.sendEvent();
    }
  }
};

void ImageImporter::update(double dt) {
  love::thread::Lock lock(imageFilteredDataMutex);
  if (hasNewFilteredData) {
    // new filtered data may have been set by the filter runner on another thread.
    // `imageDataToImage` only works on the main thread
    auto loadedImage = love::DrawDataFrame::imageDataToImage(importedImageFilteredData);

    if (importedImageFilteredPreview) {
      importedImageFilteredPreview->release();
    }
    importedImageFilteredPreview = loadedImage;

    hasNewFilteredData = false;
    loading = false;
    sendEvent();
  }
}

//
// Draw
//

void ImageImporter::draw() {
  if (importedImageFilteredPreview) {
    lv.graphics.setColor({ 1, 1, 1, 1 });
    love::Vector2 pos(0, 0);
    auto size = DRAW_MAX_SIZE * 2.0f * imageScale;
    auto imgW = float(importedImageFilteredPreview->getWidth());
    auto imgH = float(importedImageFilteredPreview->getHeight());
    auto scale = std::min(size / imgW, size / imgH);
    importedImageFilteredPreview->draw(
        &lv.graphics, love::Matrix4(pos.x, pos.y, 0, scale, scale, 0.5f * imgW, 0.5f * imgH, 0, 0));
  }
}
