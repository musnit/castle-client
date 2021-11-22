#include "image_importer.h"
#include "image_processing.h"
#include "engine.h"
#include "editor/editor.h"
#include "draw_tool.h"

std::array<int, std::size_t(60)> PALETTE = {
  0x3b1725,
  0x73172d,
  0xb4202a,
  0xdf3e23,
  0xfa6a0a,
  0xf9a31b,
  0xffd541,
  0xfffc40,
  0xd6f264,
  0x9cdb43,
  0x59c135,
  0x14a02e,
  0x1a7a3e,
  0x24523b,
  0x122020,
  0x143464,
  0x285cc4,
  0x249fde,
  0x20d6c7,
  0xa6fcdb,
  0xfef3c0,
  0xfad6b8,
  0xf5a097,
  0xe86a73,
  0xbc4a9b,
  0x793a80,
  0x403353,
  0x242234,
  0x322b28,
  0x71413b,
  0xbb7547,
  0xdba463,
  0xf4d29c,
  0xdae0ea,
  0xb3b9d1,
  0x8b93af,
  0x6d758d,
  0x4a5462,
  0x333941,
  0x422433,
  0x5b3138,
  0x8e5252,
  0xba756a,
  0xe9b5a3,
  0xe3e6ff,
  0xb9bffb,
  0x849be4,
  0x588dbe,
  0x477d85,
  0x23674e,
  0x328464,
  0x5daf8d,
  0x92dcba,
  0xcdf7e2,
  0xe4d2aa,
  0xc7b08b,
  0xa08662,
  0x796755,
  0x5a4e44,
  0x423934,
};

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

void ImageImporter::importImage(std::string uri) {
  // if uri begins with `file://` then physfs will reject it
  if (uri.rfind("file://", 0) == 0) {
    uri = uri.substr(7);
  }

  auto defaultFillPixelsPerUnit = 25.6f;
  auto maxImageSize = DRAW_MAX_SIZE * 2.0f * defaultFillPixelsPerUnit;
  int imageSize = int(maxImageSize * imageScale);

  // decode original data and downsize, generate initial preview
  love::filesystem::File *file = lv.filesystem.newFile(uri.c_str());
  love::filesystem::FileData *data = file->read();
  auto imageData = new love::image::ImageData(data);
  file->release();
  imageData = ImageProcessing::fitToMaxSize(imageData, imageSize);
  // TODO: is love freeing the previous value?
  importedImageOriginalData = imageData;
  shufflePalette();
  regeneratePreview();

  isImportingImage = true;
  sendEvent();
}

void ImageImporter::regeneratePreview() {
  if (importedImageOriginalData) {
    generateImportedImageFilteredPreview(importedImageOriginalData);
  }
}

void ImageImporter::shufflePalette() {
  // shuffle palette
  unsigned seed = std::chrono::system_clock::now().time_since_epoch().count();
  std::shuffle(PALETTE.begin(), PALETTE.end(), std::default_random_engine(seed));
}

void ImageImporter::generateImportedImageFilteredPreview(love::image::ImageData *original) {
  if (!original) {
    return;
  }

  // make a copy of the data which will be owned by the preview image, don't change original
  love::image::ImageData *imageData = original->clone();
  for (uint8 ii = 0; ii < numBlurs; ii++) {
    ImageProcessing::gaussianBlur(imageData);
  }
  ImageProcessing::kMeans(imageData, numColors, 4);
  ImageProcessing::paletteSwap(imageData, PALETTE);
  // ImageProcessing::testOnlyRedChannel(imageData);
  importedImageFilteredData = imageData;
  auto loadedImage = love::DrawDataFrame::imageDataToImage(imageData);
  love::graphics::Texture::Filter filter { love::graphics::Texture::FILTER_LINEAR,
    love::graphics::Texture::FILTER_LINEAR, love::graphics::Texture::FILTER_NONE, 1.0f };
  loadedImage->setFilter(filter);
  // TODO: is love freeing the previous value?
  importedImageFilteredPreview = loadedImage;
}

//
// Events
//

struct ImageImporterEvent {
  PROP(int, numColors);
  PROP(int, numBlurs);
};

void ImageImporter::sendEvent() {
  ImageImporterEvent ev;
  ev.numColors() = numColors;
  ev.numBlurs() = numBlurs;
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
    } else if (action == "swapColors") {
      importer.shufflePalette();
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
    auto size = DRAW_MAX_SIZE * 2.0f;
    auto imgW = float(importedImageFilteredPreview->getWidth());
    auto imgH = float(importedImageFilteredPreview->getHeight());
    auto scale = std::min(size / imgW, size / imgH);
    importedImageFilteredPreview->draw(
        &lv.graphics, love::Matrix4(pos.x, pos.y, 0, scale, scale, 0.5f * imgW, 0.5f * imgH, 0, 0));
  }
}
