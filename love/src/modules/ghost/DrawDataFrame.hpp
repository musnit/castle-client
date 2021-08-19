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
namespace ghost {

  class DrawData;

  class DrawDataFrame {
  public:
    bool isLinked;
    PathDataList pathDataList;
    Bounds fillImageBounds;
    bool _graphicsNeedsReset = true;
    ToveGraphicsHolder *_graphics = NULL;
    DrawData *_parent = NULL;
    image::ImageData *fillImageData = NULL;
    graphics::Image *fillImage = NULL;
    graphics::Canvas *pathsCanvas = NULL;
    std::optional<std::string> fillPng;
    std::optional<std::string> base64Png;

    DrawDataFrame() = default;
    DrawDataFrame(bool isLinked_)
        : isLinked(isLinked_) {
    }

    DrawDataFrame(const DrawDataFrame &other) {
      isLinked = other.isLinked;
      for (auto &otherPathData : other.pathDataList) {
        pathDataList.push_back(PathData(otherPathData));
      }
      fillImageBounds.set(other.fillImageBounds);
      fillPng = other.fillPng;
      setParent(other._parent);

      deserializeFill();
    }

    void read(Archive::Reader &archive) {
      isLinked = archive.boolean("isLinked", false);
      archive.arr("pathDataList", [&]() {
        for (auto i = 0; i < archive.size(); i++) {
          PathData pathData;
          archive.obj(i, pathData);
          pathDataList.push_back(pathData);
        }
      });

      archive.obj("fillImageBounds", fillImageBounds);
      fillPng = archive.str("fillPng", "");

      deserializeFill();
    }

    void write(Archive::Writer &archive) {
      archive.boolean("isLinked", isLinked);
      archive.arr("pathDataList", [&]() {
        for (size_t i = 0; i < pathDataList.size(); i++) {
          archive.obj(pathDataList[i]);
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
      }
    }

    // canvas helpers
    static graphics::Canvas *newCanvas(int width, int height);
    static void renderToCanvas(graphics::Canvas *canvas, const std::function<void()> &lambda);

    void deserializePathDataList();
    bool arePathDatasMergable(PathData pd1, PathData pd2);
    float round(float num, int numDecimalPlaces);
    std::vector<float> roundFloatArray(std::vector<float> a);
    void cleanUpPaths();
    Bounds getPathDataBounds(std::optional<Bounds> bounds);
    Bounds getPathDataBoundsInPixelCoordinates();
    void resetGraphics();
    ToveGraphicsHolder *graphics();
    void renderFill();
    std::optional<std::string> renderPreviewPng(int size);

    graphics::Image *imageDataToImage(image::ImageData *);
    image::ImageData *getFillImageDataSizedToPathBounds();
    graphics::Image *getFillImage();
    void updateFillImageWithFillImageData();
    void compressFillCanvas();
    bool floodFill(float x, float y);
    bool floodClear(float x, float y, float radius);
    void resetFill();
    void updatePathsCanvas();
    void deserializeFill();

    image::ImageData *canvasToImageData(graphics::Canvas *canvas);

    DrawData *parent() {
      return _parent;
    }

    void setParent(DrawData *d) {
      _parent = d;
    }
  };

  typedef std::string DrawDataLayerId;

  struct DrawDataLayer {
    std::string title;
    DrawDataLayerId id;
    bool isVisible = true;
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
      archive.arr("frames", [&]() {
        for (size_t i = 0; i < frames.size(); i++) {
          archive.obj(*frames[i]);
        }
      });
    }

    void setParent(DrawData *d) {
      for (size_t i = 0; i < frames.size(); i++) {
        frames[i]->setParent(d);
      }
    }
  };

}
}

#endif /* DrawDataFrame_hpp */
