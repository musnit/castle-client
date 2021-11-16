#include "image_importer.h"
#include "image_processing.h"
#include "engine.h"
#include "editor/editor.h"
#include "draw_tool.h"

void ImageImporter::reset() {
  if (isImportingImage) {
    importedImageFilteredPreview = nullptr;
    importedImageOriginalData = nullptr;
    isImportingImage = false;
  }
  numColors = 4;
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
  imageData = ImageProcessing::fitToMaxSize(imageData, 512);
  importedImageOriginalData.reset(imageData);
  regeneratePreview();

  isImportingImage = true;
  sendEvent();
}

void ImageImporter::regeneratePreview() {
  if (importedImageOriginalData) {
    generateImportedImageFilteredPreview(importedImageOriginalData.get());
  }
}

void ImageImporter::generateImportedImageFilteredPreview(love::image::ImageData *original) {
  if (!original) {
    return;
  }

  // make a copy of the data which will be owned by the preview image, don't change original
  love::image::ImageData *imageData = original->clone();
  ImageProcessing::gaussianBlur(imageData);
  ImageProcessing::kMeans(imageData, numColors, 4);
  ImageProcessing::randomPaletteSwap(imageData);
  // ImageProcessing::testOnlyRedChannel(imageData);
  auto loadedImage = love::DrawDataFrame::imageDataToImage(imageData);
  love::graphics::Texture::Filter filter { love::graphics::Texture::FILTER_LINEAR,
    love::graphics::Texture::FILTER_LINEAR, love::graphics::Texture::FILTER_NONE, 1.0f };
  loadedImage->setFilter(filter);
  importedImageFilteredPreview.reset(loadedImage);
}

//
// Events
//

struct ImageImporterEvent {
  PROP(int, numColors);
};

void ImageImporter::sendEvent() {
  ImageImporterEvent ev;
  ev.numColors() = numColors;
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
    auto size = 12.0f;
    auto imgW = float(importedImageFilteredPreview->getWidth());
    auto imgH = float(importedImageFilteredPreview->getHeight());
    auto scale = std::min(size / imgW, size / imgH);
    importedImageFilteredPreview->draw(
        &lv.graphics, love::Matrix4(pos.x, pos.y, 0, scale, scale, 0.5f * imgW, 0.5f * imgH, 0, 0));
  }
}
