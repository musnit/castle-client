#include "image_importer.h"
#include "image_processing.h"
#include "engine.h"
#include "editor/editor.h"
#include "draw_tool.h"

void ImageImporter::reset() {
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
  isImportingImage = false;
  numBlurs = 1;
  numColors = 4;
}

int getMaxImageSize() {
  auto defaultFillPixelsPerUnit = 25.6f;
  auto maxImageSize = DRAW_MAX_SIZE * 2.0f * defaultFillPixelsPerUnit;
  return int(maxImageSize);
}

void ImageImporter::importImage(std::string uri) {
  // if uri begins with `file://` then physfs will reject it
  if (uri.rfind("file://", 0) == 0) {
    uri = uri.substr(7);
  }

  // decode original data and downsize, generate initial preview
  love::filesystem::File *file = lv.filesystem.newFile(uri.c_str());
  love::filesystem::FileData *data = file->read();
  auto imageData = new love::image::ImageData(data);
  file->release();
  imageData = ImageProcessing::fitToMaxSize(imageData, getMaxImageSize());
  // TODO: is love freeing the previous value?
  importedImageOriginalData = imageData;
  regeneratePreview();

  isImportingImage = true;
  sendEvent();
}

void ImageImporter::regeneratePreview() {
  if (importedImageOriginalData) {
    generateImportedImageFilteredPreview(importedImageOriginalData);
  }
}

void ImageImporter::generateImportedImageFilteredPreview(love::image::ImageData *original) {
  if (!original) {
    return;
  }

  // make a copy of the data which will be owned by the preview image, don't change original
  love::image::ImageData *imageData = original->clone();
  if (!palette) {
    palette = std::make_unique<SimilarLuminancePaletteProvider>();
  }
  palette->reset();

  if (imageScale < 1.0f && imageScale > 0.0f) {
    imageData = ImageProcessing::fitToMaxSize(imageData, int(getMaxImageSize() * imageScale));
  }

  for (uint8 ii = 0; ii < numBlurs; ii++) {
    ImageProcessing::gaussianBlur(imageData);
  }
  ImageProcessing::kMeans(imageData, numColors, 4);
  ImageProcessing::paletteSwap(imageData, *palette);
  // ImageProcessing::testOnlyRedChannel(imageData);

  importedImageFilteredData = imageData;
  auto loadedImage = love::DrawDataFrame::imageDataToImage(imageData);

  // TODO: is love freeing the previous value?
  importedImageFilteredPreview = loadedImage;
}

//
// Events
//

struct ImageImporterEvent {
  PROP(int, numColors);
  PROP(int, numBlurs);
  PROP(float, imageScale);
};

void ImageImporter::sendEvent() {
  ImageImporterEvent ev;
  ev.numColors() = numColors;
  ev.numBlurs() = numBlurs;
  ev.imageScale() = imageScale;
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
    } else if (action == "swapColors") {
      importer.regeneratePreview();
    }
  }
};

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
