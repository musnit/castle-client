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
  for (uint8 ii = 0; ii < owner->numBlurs; ii++) {
    ImageProcessing::gaussianBlur(imageData);
  }
  ImageProcessing::kMeans(imageData, owner->numColors, 4);
  ImageProcessing::removeIslands(imageData, owner->minEqualNeighbors);
  ImageProcessing::paletteSwap(imageData, *(owner->palette));
  // ImageProcessing::testOnlyRedChannel(imageData);

  owner->imageFilterFinished(imageData);
  imageData = nullptr;
}

ImageImporter::~ImageImporter() {
  reset();
}

void ImageImporter::reset() {
  if (filterThread) {
    filterThread->wait();
    // TODO: is love deleting these somewhere?
    filterThread = nullptr;
  }
  if (importedImageOriginalData) {
    // TODO: is love deleting these somewhere?
    importedImageOriginalData = nullptr;
  }
  if (importedImageFilteredData) {
    // TODO: is love deleting these somewhere?
    importedImageFilteredData = nullptr;
  }
  if (importedImageFilteredPreview) {
    // TODO: is love deleting these somewhere?
    importedImageFilteredPreview = nullptr;
  }
  loading = false;
  isImportingImage = false;
  numBlurs = 1;
  numColors = 4;
  imageScale = 1.0f;
  paletteProviderType = "luminance";
  minEqualNeighbors = 1;
}

void ImageImporter::importImage(std::string uri) {
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
    // most likely love couldn't decode the image, or something else bad happened
    // TODO: mark status failed
    return;
  }
  file->release();
  if (imageData) {
    imageData = ImageProcessing::fitToMaxSize(imageData, getMaxImageSize());
    // TODO: is love freeing the previous value?
    importedImageOriginalData = imageData;
    regeneratePreview();

    isImportingImage = true;
    sendEvent();
  }
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
    // TODO: is love deleting these somewhere?
    filterThread = nullptr;
  }

  auto imageData = original->clone();
  if (imageScale < 1.0f && imageScale > 0.0f) {
    imageData
        = ImageProcessing::fitToMaxSize(imageData, int(float(getMaxImageSize()) * imageScale));
  }

  filterThread = new FilterThread(this, imageData);
  filterThread->start();
  loading = true;
  sendEvent();
}

void ImageImporter::imageFilterFinished(love::image::ImageData *imageData) {
  importedImageFilteredData = imageData;
  hasNewFilteredData = true;
}

//
// Events
//

struct ImageImporterEvent {
  PROP(bool, loading) = false;
  PROP(int, numColors);
  PROP(int, numBlurs);
  PROP(float, imageScale);
  PROP(int, minEqualNeighbors);
};

void ImageImporter::sendEvent() {
  ImageImporterEvent ev;
  ev.loading() = loading;
  ev.numColors() = numColors;
  ev.numBlurs() = numBlurs;
  ev.imageScale() = imageScale;
  ev.minEqualNeighbors() = minEqualNeighbors;
  drawTool.editor.getBridge().sendEvent("EDITOR_IMPORT_IMAGE", ev);
}

struct ImportImageActionReceiver {
  inline static const BridgeRegistration<ImportImageActionReceiver> registration {
    "IMPORT_IMAGE_ACTION"
  };

  struct Params {
    PROP(std::string, action);
    PROP(double, value);
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
      importer.regeneratePreview();
    }
  }
};

void ImageImporter::update(double dt) {
  if (hasNewFilteredData) {
    // new filtered data may have been set by the filter runner on another thread.
    // `imageDataToImage` only works on the main thread
    auto loadedImage = love::DrawDataFrame::imageDataToImage(importedImageFilteredData);

    // TODO: is love freeing the previous value?
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
