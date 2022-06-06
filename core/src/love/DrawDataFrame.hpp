//
//  DrawDataFrame.hpp
//  liblove-ios
//
//  Created by Jesse Ruder on 1/29/21.
//

#ifndef DrawDataFrame_hpp
#define DrawDataFrame_hpp

#define _USE_MATH_DEFINES

#include <stdio.h>
#include <functional>
#include <memory>

#include "GhostTypes.hpp"

namespace love {

class DrawData;
struct DrawDataLayer;

class DrawDataFrame {
public:
  bool isLinked;
  PathDataList pathDataList;
  Bounds fillImageBounds;
  bool _graphicsNeedsReset = true;
  ToveGraphicsHolder *_graphics = NULL;
  DrawDataLayer *_parentLayer = NULL;
  image::ImageData *fillImageData = NULL;
  graphics::Image *fillImage = NULL;
  graphics::Canvas *pathsCanvas = NULL;
  std::optional<std::string> fillPng;
  std::optional<std::string> base64Png;
  inline static double nextRenderTime = 0;
  double lastRenderTime = 0;

  DrawDataFrame() = default;
  DrawDataFrame(bool isLinked_, DrawDataLayer *parentLayer_)
      : isLinked(isLinked_)
      , _parentLayer(parentLayer_) {
    fillImageBounds.maxX = 0;
    fillImageBounds.maxY = 0;
    fillImageBounds.minX = 0;
    fillImageBounds.minY = 0;
  }

  DrawDataFrame(const DrawDataFrame &other) = delete;

  ~DrawDataFrame() {
    releaseRenderData();

    if (pathsCanvas) {
      pathsCanvas->release();
    }
  }

  void releaseRenderData() {
    if (_graphics || fillImageData || fillImage) {
      std::printf("releasing %p\n", (void *)this);
    }
    if (_graphics) {
      delete _graphics;
      _graphics = nullptr;
    }
    if (fillImageData) {
      fillImageData->release();
      fillImageData = nullptr;
    }
    if (fillImage) {
      fillImage->release();
      fillImage = nullptr;
    }
  }

  void read(Archive::Reader &archive) {
    isLinked = archive.boolean("isLinked", false);
    archive.arr("pathDataList", [&]() {
      for (auto i = 0; i < archive.size(); i++) {
        std::shared_ptr<PathData> pathData = std::make_shared<PathData>();
        archive.obj(i, *pathData);

        if (pathData->isValid()) {
          pathDataList.push_back(pathData);
        }
      }
    });

    archive.obj("fillImageBounds", fillImageBounds);
    fillPng = archive.str("fillPng", "");
  }

  void write(Archive::Writer &archive) {
    archive.boolean("isLinked", isLinked);
    archive.arr("pathDataList", [&]() {
      for (size_t i = 0; i < pathDataList.size(); i++) {
        if (pathDataList[i]->isValid()) {
          archive.obj(*pathDataList[i]);
        }
      }
    });

    archive.obj("fillImageBounds", fillImageBounds);
    if (fillImageData) {
      love::filesystem::FileData *fileData = fillImageData->encode(
          love::image::FormatHandler::EncodedFormat::ENCODED_PNG, "Image.png", false);
      const char *fileDataString = (const char *)fileData->getData();
      size_t fileDataSize = fileData->getSize();
      size_t dstlen = 0;
      char *result = data::encode(data::ENCODE_BASE64, fileDataString, fileDataSize, dstlen, 0);
      archive.str("fillPng", std::string(result));
      delete result;
      fileData->release();
    } else if (fillPng && fillPng->length() > 0) {
      archive.str("fillPng", *fillPng);
    }
  }

  // canvas helpers
  static graphics::Canvas *newCanvas(int width, int height);
  static love::image::ImageData *newImageData(graphics::Canvas *canvas);
  static void renderToCanvas(graphics::Canvas *canvas, const std::function<void()> &lambda);
  static std::string encodeBase64Png(love::image::ImageData *imageData);
  static std::string encodeBase64Png(graphics::Canvas *canvas);

  bool arePathDatasMergable(PathData pd1, PathData pd2);
  float round(float num, int numDecimalPlaces);
  std::vector<float> roundFloatArray(std::vector<float> a);
  void cleanUpPaths();
  Bounds getPathDataBounds(std::optional<Bounds> bounds);
  Bounds getPathDataBoundsInPixelCoordinates();
  Bounds getFillImageBoundsInPathCoordinates();
  void resetGraphics();
  ToveGraphicsHolder *graphics();
  void render();
  void renderFill();
  std::optional<std::string> renderPreviewPng(int size);

  static graphics::Image *imageDataToImage(image::ImageData *);
  void resizeFillImageDataToPathBounds();
  graphics::Image *getFillImage();
  void updateFillImageWithFillImageData();
  void compressFillCanvas();
  bool floodFill(float x, float y, Colorf color);
  bool floodClear(float x, float y, float radius);
  void resetFill();
  void updatePathsCanvas();
  void deserializeFill();

  image::ImageData *canvasToImageData(graphics::Canvas *canvas);

  DrawDataLayer *parentLayer() {
    return _parentLayer;
  }

  void setParentLayer(DrawDataLayer *l) {
    _parentLayer = l;
  }
};

typedef std::string DrawDataLayerId;

struct DrawDataLayer {
  std::string title;
  DrawDataLayerId id;
  bool isVisible = true;
  bool isBitmap = false;
  DrawData *_parent = NULL;
  std::vector<std::shared_ptr<DrawDataFrame>> frames;

  DrawDataLayer() = default;
  DrawDataLayer(std::string title_, DrawDataLayerId id_)
      : title(title_)
      , id(id_) {
  }

  void read(Archive::Reader &archive) {
    title = archive.str("title", "");
    id = archive.str("id", "");
    isVisible = archive.boolean("isVisible", true);
    isBitmap = archive.boolean("isBitmap", false);
    archive.arr("frames", [&]() {
      for (auto i = 0; i < archive.size(); i++) {
        auto frame = std::make_shared<DrawDataFrame>();
        archive.obj(i, *frame);
        frames.push_back(std::move(frame));
      }
    });
  }

  void write(Archive::Writer &archive) {
    archive.str("title", title);
    archive.str("id", id);
    archive.boolean("isVisible", isVisible);
    archive.boolean("isBitmap", isBitmap);
    archive.arr("frames", [&]() {
      for (size_t i = 0; i < frames.size(); i++) {
        archive.obj(*frames[i]);
      }
    });
  }

  DrawData *parent() {
    return _parent;
  }

  void setParent(DrawData *d) {
    _parent = d;
    for (auto &frame : frames) {
      frame->setParentLayer(this);
    }
  }
};

}

#endif /* DrawDataFrame_hpp */
