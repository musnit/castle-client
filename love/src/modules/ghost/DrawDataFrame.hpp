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
    std::unique_ptr<ToveGraphicsHolder> _graphics;
    DrawData *_parent;
    std::unique_ptr<image::ImageData> fillImageData;
    std::unique_ptr<graphics::Image> fillImage;
    std::unique_ptr<graphics::Canvas> pathsCanvas;
    std::optional<std::string> fillPng;

    void read(lua_State *L, int index) {
      GHOST_READ_BOOL(isLinked, false)
      GHOST_READ_VECTOR(pathDataList, PathData)
      GHOST_READ_STRUCT(fillImageBounds)
      GHOST_READ_STRING(fillPng)

      deserializeFillAndPreview();
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

      deserializeFillAndPreview();
    }

    void write(Archive::Writer &archive) {
      archive.boolean("isLinked", isLinked);
      archive.arr("pathDataList", [&]() {
        for (size_t i = 0; i < pathDataList.size(); i++) {
          archive.obj(pathDataList[i]);
        }
      });

      archive.obj("fillImageBounds", fillImageBounds);
      if (fillPng) {
        archive.str("fillPng", *fillPng);
      }
    }

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

    graphics::Image *imageDataToImage(image::ImageData *);
    image::ImageData *getFillImageDataSizedToPathBounds();
    graphics::Image *getFillImage();
    void updateFillImageWithFillImageData();
    void compressFillCanvas();
    bool floodFill(float x, float y);
    bool floodClear(float x, float y, float radius);
    void resetFill();
    void updatePathsCanvas();
    void deserializeFillAndPreview();

    image::ImageData *canvasToImageData(graphics::Canvas *canvas);
    graphics::Canvas *newCanvas(int width, int height);
    void renderToCanvas(graphics::Canvas *canvas, const std::function<void()> &lambda);

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
    bool isVisible;
    std::vector<std::unique_ptr<DrawDataFrame>> frames;

    void read(lua_State *L, int index) {
      GHOST_READ_STRING(title)
      GHOST_READ_STRING(id)
      GHOST_READ_BOOL(isVisible, true)
      GHOST_READ_POINTER_VECTOR(frames, DrawDataFrame)
    }

    void read(Archive::Reader &archive) {
      title = archive.str("title", "");
      id = archive.str("id", "");
      isVisible = archive.boolean("isVisible", true);
      archive.arr("frames", [&]() {
        for (auto i = 0; i < archive.size(); i++) {
          auto frame = std::make_unique<DrawDataFrame>();
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
