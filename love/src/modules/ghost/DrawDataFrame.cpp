//
//  DrawDataFrame.cpp
//  liblove-ios
//
//  Created by Jesse Ruder on 1/29/21.
//

#include "DrawDataFrame.hpp"
#include "DrawData.hpp"
#include "DrawAlgorithms.hpp"
#include "image/Image.h"
#include "data/DataModule.h"
#include "filesystem/Filesystem.h"

#define DEBUG_FILL_IMAGE_SIZE false
#define DEBUG_UPDATE_FLOOD_FILL 0

namespace love {
namespace ghost {

  void DrawDataFrame::deserializeFill() {
    if (fillPng && fillPng->length() > 0) {
      // data::ContainerType ctype = data::CONTAINER_STRING;
      data::EncodeFormat format = data::ENCODE_BASE64;

      size_t fileDataStringLen = 0;
      char *fileDataString = nullptr;
      fileDataString = data::decode(format, fillPng->c_str(), fillPng->length(), fileDataStringLen);

      data::DataModule *dataModule = Module::getInstance<data::DataModule>(Module::M_DATA);
      auto byteData = dataModule->newByteData(fileDataString, fileDataStringLen, true);

      image::Image *imageModule = Module::getInstance<image::Image>(Module::M_IMAGE);
      fillImageData = imageModule->newImageData(byteData);

      byteData->release(); // this also deletes fileDataString
    }
  }

  bool DrawDataFrame::arePathDatasMergable(PathData pd1, PathData pd2) {
    if (!DrawAlgorithms::coordinatesEqual(pd1.points[pd1.points.size() - 1], pd2.points[0])) {
      return false;
    }
    if (pd1.style != pd2.style) {
      return false;
    }
    if (!DrawAlgorithms::optionalCoordinatesEqual(pd1.bendPoint, pd2.bendPoint)) {
      return false;
    }
    if (pd1.isFreehand != pd2.isFreehand) {
      return false;
    }
    if (!DrawAlgorithms::colorsEqual(pd1.color, pd2.color)) {
      return false;
    }
    return true;
  }

  float DrawDataFrame::round(float num, int numDecimalPlaces) {
    auto mult = 10 ^ numDecimalPlaces;
    return floor((num * mult) + 0.5) / mult;
  }

  std::vector<float> DrawDataFrame::roundFloatArray(std::vector<float> a) {
    for (size_t i = 0; i < a.size(); i++) {
      a[i] = round(a[i], 4);
    }
    return a;
  }

  void DrawDataFrame::cleanUpPaths() {
    for (size_t i = 0; i < pathDataList.size(); i++) {
      parentLayer()->parent()->updatePathDataRendering(&pathDataList[i]);
    }
  }

  Bounds DrawDataFrame::getPathDataBounds(std::optional<Bounds> bounds) {
    if (!bounds) {
      Bounds newBounds;
      newBounds.minX = DRAW_MAX_SIZE;
      newBounds.minY = DRAW_MAX_SIZE;
      newBounds.maxX = -DRAW_MAX_SIZE;
      newBounds.maxY = -DRAW_MAX_SIZE;
      bounds = newBounds;
    }
    // https://poke1024.github.io/tove2d-api/classes/Graphics.html#Graphics:computeAABB
    auto [minX, minY, maxX, maxY] = graphics()->computeAABB();
    minX = minX + (DRAW_LINE_WIDTH / 2);
    minY = minY + (DRAW_LINE_WIDTH / 2);
    maxX = maxX - (DRAW_LINE_WIDTH / 2);
    maxY = maxY - (DRAW_LINE_WIDTH / 2);
    // we still need this because of isTransparent
    for (size_t i = 0; i < pathDataList.size(); i++) {
      auto pathData = pathDataList[i];
      for (size_t j = 0; j < pathData.points.size(); j++) {
        auto x = pathData.points[j].x;
        auto y = pathData.points[j].y;
        if (x < minX) {
          minX = x;
        }
        if (y < minY) {
          minY = y;
        }
        if (x > maxX) {
          maxX = x;
        }
        if (y > maxY) {
          maxY = y;
        }
      }
    }
    if (minX < bounds->minX) {
      bounds->minX = minX;
    }
    if (minY < bounds->minY) {
      bounds->minY = minY;
    }
    if (maxX > bounds->maxX) {
      bounds->maxX = maxX;
    }
    if (maxY > bounds->maxY) {
      bounds->maxY = maxY;
    }
    return *bounds;
  }

  Bounds DrawDataFrame::getPathDataBoundsInPixelCoordinates() {
    auto bounds = getPathDataBounds(std::nullopt);
    Bounds newBounds;
    auto fillPixelsPerUnit = parentLayer()->parent()->fillPixelsPerUnit;
    newBounds.minX = floor(bounds.minX * fillPixelsPerUnit);
    newBounds.minY = floor(bounds.minY * fillPixelsPerUnit);
    newBounds.maxX = ceil(bounds.maxX * fillPixelsPerUnit);
    newBounds.maxY = ceil(bounds.maxY * fillPixelsPerUnit);
    return newBounds;
  }

  Bounds DrawDataFrame::getFillImageBoundsInPathCoordinates() {
    Bounds newBounds;
    if (fillImageData) {
      int boundsResult[4] = { -1, -1, -1, -1 };
      int halfWidth = fillImageData->getWidth() / 2, halfHeight = fillImageData->getHeight() / 2;
      fillImageData->getBounds(boundsResult);
      auto fillPixelsPerUnit = parentLayer()->parent()->fillPixelsPerUnit;
      newBounds.minX = (boundsResult[0] - halfWidth) / fillPixelsPerUnit;
      newBounds.minY = (boundsResult[1] - halfHeight) / fillPixelsPerUnit;
      newBounds.maxX = (boundsResult[2] - halfWidth) / fillPixelsPerUnit;
      newBounds.maxY = (boundsResult[3] - halfHeight) / fillPixelsPerUnit;
    }
    return newBounds;
  }

  void DrawDataFrame::resetGraphics() {
    _graphicsNeedsReset = true;
  }

  void DrawDataFrame::resizeFillImageDataToPathBounds() {
    auto pathBounds = getPathDataBoundsInPixelCoordinates();
    auto width = pathBounds.maxX - pathBounds.minX;
    auto height = pathBounds.maxY - pathBounds.minY;
    // imagedata can't have 0 width/height
    if (width < 1) {
      width = 1;
    }
    if (height < 1) {
      height = 1;
    }

    image::Image *instance = Module::getInstance<image::Image>(Module::M_IMAGE);
    if (fillImageData == NULL) {
      fillImageData = instance->newImageData(width, height, PIXELFORMAT_RGBA8);
    } else if (fillImageData->getWidth() != width || fillImageData->getHeight() != height) {
      auto newFillImageData = instance->newImageData(width, height, PIXELFORMAT_RGBA8);
      // sourceX, sourceY, sourceWidth, sourceHeight, destX, destY
      newFillImageData->copyImageData(fillImageData, 0, 0,
          fillImageBounds.maxX - fillImageBounds.minX, fillImageBounds.maxY - fillImageBounds.minY,
          fillImageBounds.minX - pathBounds.minX, fillImageBounds.minY - pathBounds.minY);
      fillImageData->release();
      fillImageData = newFillImageData;
    }
    fillImageBounds.set(pathBounds);
  }

  graphics::Image *DrawDataFrame::imageDataToImage(image::ImageData *imageData) {
    graphics::Image::Settings settings;

    graphics::Image::Slices slices(graphics::TEXTURE_2D);
    slices.set(0, 0, imageData);
    graphics::Graphics *instance = Module::getInstance<graphics::Graphics>(Module::M_GRAPHICS);

    graphics::Image *image = instance->newImage(slices, settings);
    graphics::Texture::Filter f = image->getFilter();
    f.min = graphics::Texture::FILTER_NEAREST;
    f.mag = graphics::Texture::FILTER_NEAREST;
    image->setFilter(f);

    return image;
  }

  graphics::Image *DrawDataFrame::getFillImage() {
    if (fillImage != NULL) {
      return fillImage;
    }
    if (fillImageData == NULL) {
      return NULL;
    }
    fillImage = DrawDataFrame::imageDataToImage(fillImageData);
    return fillImage;
  }

  void DrawDataFrame::updateFillImageWithFillImageData() {
    if (fillImageData == NULL) {
      return;
    }
    if (fillImage != NULL) {
      /*if (fillImage->getWidth() == fillImageData->getWidth()
          && fillImage->getHeight() == fillImageData->getHeight()) {
        fillImage->replacePixels(fillImageData, 0, 0, 0, 0, false);
        return;
      }*/
      delete fillImage;
    }
    fillImage = DrawDataFrame::imageDataToImage(fillImageData);
  }

  void DrawDataFrame::compressFillCanvas() {
    if (fillImageData == NULL) {
      return;
    }
    if (fillImageData->isEmpty()) {
      fillImageData->release();
      if (fillImage != NULL) {
        fillImage->release();
      }
      fillImageData = NULL;
      fillImage = NULL;
    } else {
      int boundsResult[4] = { -1, -1, -1, -1 };
      fillImageData->getBounds(boundsResult);

      auto [minX, minY, maxX, maxY] = boundsResult;
      auto width = (maxX - minX) + 1;
      auto height = (maxY - minY) + 1;
      image::Image *instance = Module::getInstance<image::Image>(Module::M_IMAGE);
      auto newFillImageData = instance->newImageData(width, height, PIXELFORMAT_RGBA8);
      // sourceX, sourceY, sourceWidth, sourceHeight, destX, destY
      newFillImageData->copyImageData(fillImageData, minX, minY, width, height, 0, 0);
      if (DEBUG_FILL_IMAGE_SIZE) {
        image::Pixel p;
        p.rgba8[0] = 1.0;
        p.rgba8[1] = 0.0;
        p.rgba8[2] = 0.0;
        p.rgba8[3] = 1.0;

        for (size_t x = 0; x < width - 1; x++) {
          newFillImageData->setPixel(x, 0, p);
        }
        for (size_t y = 0; y < height - 1; y++) {
          newFillImageData->setPixel(0, y, p);
        }
      }
      fillImageData->release();
      fillImageData = newFillImageData;
      fillImageBounds.minX = fillImageBounds.minX + minX;
      fillImageBounds.minY = fillImageBounds.minY + minY;
      fillImageBounds.maxX = fillImageBounds.maxX + minX;
      fillImageBounds.maxY = fillImageBounds.maxY + minY;
    }
  }

  image::ImageData *DrawDataFrame::canvasToImageData(graphics::Canvas *canvas) {
    image::Image *instance = Module::getInstance<image::Image>(Module::M_IMAGE);
    Rect rect = { 0, 0, canvas->getPixelWidth(), canvas->getPixelHeight() };
    return canvas->newImageData(instance, 0, 0, rect);
  }

  bool DrawDataFrame::floodFill(float x, float y, Colorf color) {
    image::Pixel p;
    p.rgba8[0] = color.r * 255.0;
    p.rgba8[1] = color.g * 255.0;
    p.rgba8[2] = color.b * 255.0;
    p.rgba8[3] = 255.0;

    // TODO: why was this here? fillImageData->getFormat();
    auto fillPixelsPerUnit = parentLayer()->parent()->fillPixelsPerUnit;
    int pixelCount = 0;

    if (parentLayer()->isBitmap) {
      pixelCount = fillImageData->floodFill(floor((x * fillPixelsPerUnit) - fillImageBounds.minX),
          floor((y * fillPixelsPerUnit) - fillImageBounds.minY), nullptr, p, true);
    } else {
      updatePathsCanvas();
      auto pathsImageData = canvasToImageData(pathsCanvas);
      resizeFillImageDataToPathBounds();
      pixelCount = fillImageData->floodFill(floor((x * fillPixelsPerUnit) - fillImageBounds.minX),
          floor((y * fillPixelsPerUnit) - fillImageBounds.minY), pathsImageData, p, false);
      pathsImageData->release();
    }
    compressFillCanvas();
    updateFillImageWithFillImageData();
    return pixelCount > 0;
  }

  bool DrawDataFrame::floodClear(float x, float y, float radius) {
    auto fillPixelsPerUnit = parentLayer()->parent()->fillPixelsPerUnit;
    int pixelCount = 0;

    if (parentLayer()->isBitmap) {
      pixelCount
          = fillImageData->floodFillErase(floor((x * fillPixelsPerUnit) - fillImageBounds.minX),
              floor((y * fillPixelsPerUnit) - fillImageBounds.minY),
              floor(radius * fillPixelsPerUnit), nullptr);
    } else {
      updatePathsCanvas();
      auto pathsImageData = canvasToImageData(pathsCanvas);
      resizeFillImageDataToPathBounds();
      pixelCount
          = fillImageData->floodFillErase(floor((x * fillPixelsPerUnit) - fillImageBounds.minX),
              floor((y * fillPixelsPerUnit) - fillImageBounds.minY),
              floor(radius * fillPixelsPerUnit), pathsImageData);
      pathsImageData->release();
    }
    compressFillCanvas();
    updateFillImageWithFillImageData();
    return pixelCount > 0;
  }

  void DrawDataFrame::resetFill() {
    cleanUpPaths();
    updatePathsCanvas();
    if (!parentLayer()->isBitmap) {
      auto pathsImageData = canvasToImageData(pathsCanvas);
      resizeFillImageDataToPathBounds();
      fillImageData->updateFloodFillForNewPaths(pathsImageData, DEBUG_UPDATE_FLOOD_FILL);
      pathsImageData->release();
    }
    compressFillCanvas();
    updateFillImageWithFillImageData();
  }

  graphics::Canvas *DrawDataFrame::newCanvas(int width, int height) {
    graphics::Graphics *instance = Module::getInstance<graphics::Graphics>(Module::M_GRAPHICS);

    graphics::Canvas::Settings settings;
    settings.width = width;
    settings.height = height;
    settings.dpiScale = 1;
    settings.msaa = 4;

    return instance->newCanvas(settings);
  }

  void DrawDataFrame::renderToCanvas(
      graphics::Canvas *canvas, const std::function<void()> &lambda) {
    graphics::Graphics::RenderTarget rt(canvas);

    graphics::Graphics *graphics = Module::getInstance<graphics::Graphics>(Module::M_GRAPHICS);

    graphics::Graphics::RenderTargets oldtargets = graphics->getCanvas();

    for (auto c : oldtargets.colors)
      c.canvas->retain();

    if (oldtargets.depthStencil.canvas != nullptr)
      oldtargets.depthStencil.canvas->retain();

    graphics->setCanvas(rt, false);

    lambda();

    graphics->setCanvas(oldtargets);

    for (auto c : oldtargets.colors)
      c.canvas->release();

    if (oldtargets.depthStencil.canvas != nullptr)
      oldtargets.depthStencil.canvas->release();
  }

  void DrawDataFrame::updatePathsCanvas() {
    auto bounds = getPathDataBoundsInPixelCoordinates();
    auto width = bounds.maxX - bounds.minX;
    auto height = bounds.maxY - bounds.minY;
    // canvas can't have 0 width/height
    if (width < 1) {
      width = 1;
    }
    if (height < 1) {
      height = 1;
    }
    if (pathsCanvas == NULL || pathsCanvas->getWidth() != width
        || pathsCanvas->getHeight() != height) {
      if (pathsCanvas != NULL) {
        delete pathsCanvas;
      }
      pathsCanvas = newCanvas(width, height);
    }

    renderToCanvas(pathsCanvas, [bounds, this]() {
      graphics::Graphics *graphicsModule
          = Module::getInstance<graphics::Graphics>(Module::M_GRAPHICS);

      auto fillPixelsPerUnit = parentLayer()->parent()->fillPixelsPerUnit;
      graphicsModule->push(graphics::Graphics::STACK_TRANSFORM);
      graphicsModule->origin();
      graphicsModule->translate(-bounds.minX, -bounds.minY);
      graphicsModule->scale(fillPixelsPerUnit, fillPixelsPerUnit);

      graphics::OptionalColorf clearColor(Colorf(0.0f, 0.0f, 0.0f, 0.0f));
      OptionalInt stencil(0);
      OptionalDouble depth(1.0);
      graphicsModule->clear(clearColor, stencil, depth);

      Colorf color;
      color.r = 1.0;
      color.g = 1.0;
      color.b = 1.0;
      color.a = 1.0;
      graphicsModule->setColor(color);

      graphics()->draw();

      graphicsModule->pop();
    });
  }

  ToveGraphicsHolder *DrawDataFrame::graphics() {
    if (_graphicsNeedsReset || _graphics == NULL) {
      if (_graphics != NULL) {
        delete _graphics;
        _graphics = nullptr;
      }

      _graphicsNeedsReset = false;
      cleanUpPaths();
      _graphics = new ToveGraphicsHolder();
      for (size_t i = 0; i < pathDataList.size(); i++) {
        _graphics->addPath(pathDataList[i].tovePath);
      }
    }
    return _graphics;
  }

  void DrawDataFrame::renderFill() {
    auto fillImage = getFillImage();
    if (fillImage != NULL) {
      graphics::Graphics *graphicsModule
          = Module::getInstance<graphics::Graphics>(Module::M_GRAPHICS);

      auto fillPixelsPerUnit = parentLayer()->parent()->fillPixelsPerUnit;
      float x = fillImageBounds.minX / fillPixelsPerUnit;
      float y = fillImageBounds.minY / fillPixelsPerUnit;
      float a = 0.0;
      float sx = 1 / fillPixelsPerUnit;
      float sy = 1 / fillPixelsPerUnit;

      // Avoid using `love::graphics::Graphics::draw` directly since it needs to stream vertex
      // information, which doesn't perform well on WebGL -- we'll just keep and use our own static
      // mesh of vertex information instead
      //
      // This was the old code:
      //   Matrix4 mat = Matrix4(x, y, a, sx, sy, 0.0, 0.0, 0.0, 0.0);
      //   graphicsModule->draw(fillImage, mat);
      //
      static auto quad = [&]() {
        std::vector<love::graphics::Vertex> quadVerts {
          { 0, 0, 0, 0, { 0xff, 0xff, 0xff, 0xff } },
          { 1, 0, 1, 0, { 0xff, 0xff, 0xff, 0xff } },
          { 1, 1, 1, 1, { 0xff, 0xff, 0xff, 0xff } },
          { 0, 1, 0, 1, { 0xff, 0xff, 0xff, 0xff } },
        };
        return graphicsModule->newMesh(quadVerts, love::graphics::PRIMITIVE_TRIANGLE_FAN,
            love::graphics::vertex::USAGE_STATIC);
      }();
      quad->setTexture(fillImage);
      auto iw = fillImage->getWidth(), ih = fillImage->getHeight();
      quad->draw(graphicsModule, love::Matrix4(x, y, a, sx * iw, sy * ih, 0, 0, 0, 0));
      quad->setTexture(nullptr);
    }
  }

  love::image::ImageData *DrawDataFrame::newImageData(graphics::Canvas *canvas) {
    image::Image *imageModule = Module::getInstance<image::Image>(Module::M_IMAGE);
    Rect rect = { 0, 0, canvas->getPixelWidth(), canvas->getPixelHeight() };
    return canvas->newImageData(imageModule, 0, 0, rect);
  }

  std::string DrawDataFrame::encodeBase64Png(love::image::ImageData *imageData) {
    love::filesystem::FileData *fileData = imageData->encode(
        love::image::FormatHandler::EncodedFormat::ENCODED_PNG, "Image.png", false);
    const char *fileDataString = (const char *)fileData->getData();
    size_t fileDataSize = fileData->getSize();
    size_t dstlen = 0;
    char *cStrResult = data::encode(data::ENCODE_BASE64, fileDataString, fileDataSize, dstlen, 0);
    fileData->release();
    auto result = std::string(cStrResult);
    delete cStrResult;
    return result;
  }

  std::string DrawDataFrame::encodeBase64Png(graphics::Canvas *canvas) {
    love::image::ImageData *imageData = newImageData(canvas);
    std::string result = encodeBase64Png(imageData);
    delete imageData;
    return result;
  }

  std::optional<std::string> DrawDataFrame::renderPreviewPng(int size) {
    if (isLinked) {
      return std::nullopt;
    }
    if (size <= 0) {
      size = 256;
    }

    auto previewCanvas = newCanvas(size, size);

    renderToCanvas(previewCanvas, [this, size]() {
      Bounds bounds;
      if (parentLayer()->isBitmap) {
        bounds = getFillImageBoundsInPathCoordinates();
      } else {
        bounds = getPathDataBounds(std::nullopt);
      }
      float width = bounds.maxX - bounds.minX;
      float height = bounds.maxY - bounds.minY;

      float maxDimension = width;
      if (height > maxDimension) {
        maxDimension = height;
      }

      float widthPadding = (maxDimension - width) / 2.0;
      float heightPadding = (maxDimension - height) / 2.0;

      float padding = maxDimension * 0.025;

      graphics::Graphics *graphicsModule
          = Module::getInstance<graphics::Graphics>(Module::M_GRAPHICS);
      graphicsModule->push(graphics::Graphics::STACK_ALL);
      graphicsModule->origin();
      graphicsModule->scale(size / (maxDimension * 1.05), size / (maxDimension * 1.05));
      graphicsModule->translate(
          (padding - bounds.minX) + widthPadding, (padding - bounds.minY) + heightPadding);
      graphicsModule->clear(Colorf(0.0f, 0.0f, 0.0f, 0.0f), 0, 1.0);
      graphicsModule->setColor({ 1.0, 1.0, 1.0, 1.0 });

      renderFill();
      graphics()->draw();
      graphicsModule->pop();
    });

    auto result = encodeBase64Png(previewCanvas);
    delete previewCanvas;
    return result;
  }


}
}
