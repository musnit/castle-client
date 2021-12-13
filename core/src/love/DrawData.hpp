//
//  DrawData.hpp
//  liblove-ios
//
//  Created by Jesse Ruder on 1/27/21.
//

#ifndef DrawData_hpp
#define DrawData_hpp

#define _USE_MATH_DEFINES

#include <stdio.h>
#include <tuple>
#include <functional>

#include "common/Object.h"
#include "GhostTypes.hpp"
#include "DrawDataFrame.hpp"

namespace love {

class DrawData : public Object {
public:
  static love::Type type;

  // `color` is no longer used in the editor, which maintains its own selected color state
  __attribute__((deprecated)) love::Colorf color;
  love::Colorf lineColor;
  float gridSize;
  float scale;
  int version;
  float fillPixelsPerUnit;
  std::vector<std::optional<Bounds>> framesBounds;

  // `selectedLayerId` and `selectedFrame` are no longer used, this state is maintained by the
  // editor
  __attribute__((deprecated)) DrawDataLayerId selectedLayerId;
  __attribute__((deprecated)) OneIndexFrame selectedFrame;

  std::vector<std::shared_ptr<DrawDataLayer>> layers;

  DrawData(std::shared_ptr<DrawData> other) {
    Archive archive;
    archive.write([&](Archive::Writer &w) {
      other->write(w);
    });

    archive.read([&](Archive::Reader &r) {
      read(r);
    });
  }

  DrawData(const std::string &json) {
    auto archive = Archive::fromJson(json.c_str());

    archive.read([&](Archive::Reader &r) {
      read(r);
    });
  }

  DrawData(Archive::Reader &archive) {
    read(archive);
    /*ToveSubpathRef subpath = NewSubpath();
    TovePathRef path = NewPath(null);*/
  }

  /*template<typename A>
  void archive(A &obj) {
          obj.arr("color", color);
          obj.arr("lineColor", lineColor);
          obj.num("gridSize", )
  }*/

  void read(Archive::Reader &archive) {
    love::Colorf c;
    archive.arr("color", [&]() {
      c.set(archive.num((unsigned int)0, 1.0), archive.num(1, 1.0), archive.num(2, 1.0),
          archive.num(3, 1.0));
    });
#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wdeprecated-declarations"
    color = c;
#pragma GCC diagnostic pop

    love::Colorf c2;
    archive.arr("lineColor", [&]() {
      c2.set(archive.num((unsigned int)0, 1.0), archive.num(1, 1.0), archive.num(2, 1.0),
          archive.num(3, 1.0));
    });
    lineColor = c2;


    gridSize = archive.num("gridSize", 0.71428571428571);
    scale = archive.num("scale", 10);
    version = archive.num("version", 3);
    fillPixelsPerUnit = archive.num("fillPixelsPerUnit", 25.6);
    // int numTotalLayers = archive.num("numTotalLayers", 1);
    archive.each("framesBounds", [&]() {
      std::optional<Bounds> bounds;
      archive.read(bounds);
      framesBounds.push_back(bounds);
    });
#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wdeprecated-declarations"
    selectedLayerId = archive.str("selectedLayerId", "");
    selectedFrame.value = archive.num("selectedFrame", 1);
#pragma GCC diagnostic pop
    archive.arr("layers", [&]() {
      for (auto i = 0; i < archive.size(); i++) {
        auto layer = std::make_shared<DrawDataLayer>();
        archive.obj(i, *layer);
        layer->setParent(this);
        layers.push_back(std::move(layer));
      }
    });
  }

  std::string serialize() {
    Archive archive;
    archive.write([&](Archive::Writer &w) {
      write(w);
    });

    return archive.toJson();
  }

  void write(Archive::Writer &archive) {
    archive.arr("color", [&]() {
#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wdeprecated-declarations"
      // TODO: we're still writing this to provide backwards-compat with old scenes
      archive.num(color.r);
      archive.num(color.g);
      archive.num(color.b);
      archive.num(color.a);
#pragma GCC diagnostic pop
    });
    archive.arr("lineColor", [&]() {
      archive.num(lineColor.r);
      archive.num(lineColor.g);
      archive.num(lineColor.b);
      archive.num(lineColor.a);
    });
    archive.num("gridSize", gridSize);
    archive.num("scale", scale);
    archive.num("version", version);
    archive.num("fillPixelsPerUnit", fillPixelsPerUnit);
    archive.num("numTotalLayers", getNumLayers());

    for (size_t i = 0; i < framesBounds.size(); i++) {
      getBounds(i);
    }

    archive.arr("framesBounds", [&]() {
      for (auto &bounds : framesBounds) {
        archive.obj([&]() {
          archive.write(*bounds);
        });
      }
    });

    // TODO: we're still writing selectedFrame to provide backwards-compat with old scenes.
    // don't write `selectedLayerId` at all, server migration will pick a value if needed
    archive.num("selectedFrame", 1);

    archive.arr("layers", [&]() {
      for (size_t i = 0; i < layers.size(); i++) {
        archive.obj(*layers[i]);
      }
    });
  }

  int getNumLayers() {
    return layers.size();
  }

  float gridCellSize();
  std::tuple<float, float> globalToGridCoordinates(float x, float y);
  std::tuple<float, float> gridToGlobalCoordinates(float x, float y);
  std::tuple<float, float> roundGlobalDiffCoordinatesToGrid(float x, float y);
  std::tuple<float, float> roundGlobalCoordinatesToGrid(float x, float y);
  std::tuple<float, float> clampGlobalCoordinates(float x, float y);
  float roundGlobalDistanceToGrid(float d);
  void makeSubpathsFromSubpathData(PathData *pathData);
  void addLineSubpathData(PathData *pathData, float p1x, float p1y, float p2x, float p2y);
  void addCircleSubpathData(PathData *pathData, float centerX, float centerY, float radius,
      float startAngle, float endAngle);
  void drawEndOfArc(PathData *pathData, float p1x, float p1y, float p2x, float p2y);
  void addSubpathDataForPoints(PathData *pathData, Point p1, Point p2);
  void updatePathDataRendering(PathData *pathData);
  int getRealFrameIndexForLayerId(DrawDataLayerId layerId, int frame);
  int getRealFrameIndexForLayerId(DrawDataLayerId layerId, OneIndexFrame frame);
  DrawDataLayer *layerForId(DrawDataLayerId id);
  void clearBounds();
  void updateFrameBounds(OneIndexFrame frameIndex);
  Bounds getBounds(int frame);
  bool arePathDatasFloodFillable(PathData &pd1, PathData &pd2);
  void updateFramePreview(DrawDataLayerId layerId, OneIndexFrame frameIndex);
  AnimationState newAnimationState();
  int getNumFrames();
  int modFrameIndex(int value);
  int modFrameIndex(OneIndexFrame frame);
  struct RunAnimationResult {
    bool loop = false;
    bool end = false;
    bool changed = false;
  };
  RunAnimationResult runAnimation(
      AnimationState &animationState, AnimationComponentProperties &componentProperties, float dt);
  void renderFrameIndex(int frameIdx /* zero index */);
  std::unique_ptr<graphics::Canvas> renderPreviewCanvas(int frameIdx, int size);
  std::optional<std::string> renderPreviewPng(int frameIdx, int size);
  void renderForTool(DrawDataLayerId layerId, OneIndexFrame frameIndex, float tempTranslateX,
      float tempTranslateY, std::shared_ptr<ToveGraphicsHolder> tempGraphics);
  bool isPointInBounds(Point point);

  void addLayer(std::string title, DrawDataLayerId id, int order = -1);

  // return the index removed, or -1 if not removed
  int deleteLayer(const DrawDataLayerId &id);

  void setLayerOrder(const DrawDataLayerId &id, int newIndexInLayers);

  void addFrame();
  void addFrame(OneIndexFrame frameIndex);
  bool deleteFrame(OneIndexFrame frameIndex);
  void copyCell(std::shared_ptr<DrawDataFrame> sourceFrame, DrawDataLayerId destLayerId,
      OneIndexFrame destFrameIndex);
  void copyCell(DrawDataLayerId sourceLayerId, OneIndexFrame sourceFrameIndex,
      DrawDataLayerId destLayerId, OneIndexFrame destFrameIndex);
  void setCellLinked(DrawDataLayerId layerId, OneIndexFrame frameIndex, bool isLinked);
  void clearFrame(DrawDataLayerId layerId, OneIndexFrame frameIndex);
};

}


#endif /* DrawData_hpp */
