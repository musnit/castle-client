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
namespace ghost {

  class DrawData : public Object {
    /*
     local newObj = {
             _graphics = nil,
             _graphicsNeedsReset = true,
             pathDataList = obj.pathDataList or {},
             color = obj.color or obj.fillColor or {hexStringToRgb("f9a31b")},
             lineColor = obj.lineColor or {hexStringToRgb("f9a31b")},
             gridSize = obj.gridSize or 0.71428571428571,
             scale = obj.scale or DRAW_DATA_SCALE,
             pathsCanvas = nil,
             fillImageData = nil,
             fillImage = nil,
             fillImageBounds = obj.fillImageBounds or {
                     maxX = 0,
                     maxY = 0,
                     minX = 0,
                     minY = 0
             },
             fillCanvasSize = obj.fillCanvasSize or FILL_CANVAS_SIZE,
             fillPng = obj.fillPng or nil,
             version = obj.version or nil,
             fillPixelsPerUnit = obj.fillPixelsPerUnit or 25.6,
             bounds = obj.bounds or nil,
             framesBounds = obj.framesBounds or {},
             layers = obj.layers or {},
             numTotalLayers = obj.numTotalLayers or 1,
             selectedLayerId = obj.selectedLayerId or nil,
             selectedFrame = obj.selectedFrame or 1,
             _layerDataChanged = true,
             _layerData = nil,
     }

     */
  public:
    static love::Type type;

    love::Colorf color;
    love::Colorf lineColor;
    float gridSize;
    float scale;
    int version;
    float fillPixelsPerUnit;
    std::vector<std::optional<Bounds>> framesBounds;
    DrawDataLayerId selectedLayerId;
    OneIndexFrame selectedFrame;
    std::vector<std::unique_ptr<DrawDataLayer>> layers;

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
        c.set(archive.num((unsigned int)0, 1.0), archive.num(1, 1.0), archive.num(2, 1.0), archive.num(3, 1.0));
      });
      color = c;

      love::Colorf c2;
      archive.arr("lineColor", [&]() {
        c2.set(archive.num((unsigned int)0, 1.0), archive.num(1, 1.0), archive.num(2, 1.0), archive.num(3, 1.0));
      });
      lineColor = c2;


      gridSize = archive.num("gridSize", 0.71428571428571);
      scale = archive.num("scale", 10);
      version = archive.num("version", 3);
      fillPixelsPerUnit = archive.num("fillPixelsPerUnit", 25.6);
      // int numTotalLayers = archive.num("numTotalLayers", 1);
      archive.arr("framesBounds", [&]() {
        for (auto i = 0; i < archive.size(); i++) {
          Bounds bounds;
          archive.obj(i, bounds);
          framesBounds.push_back(bounds);
        }
      });
      // TODO: default this to first layer on the server
      selectedLayerId = archive.str("selectedLayerId", "");
      selectedFrame.value = archive.num("selectedFrame", 1);
      archive.arr("layers", [&]() {
        for (auto i = 0; i < archive.size(); i++) {
          auto layer = std::make_unique<DrawDataLayer>();
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
        archive.num(color.r);
        archive.num(color.g);
        archive.num(color.b);
        archive.num(color.a);
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
      archive.arr("framesBounds", [&]() {
        for (size_t i = 0; i < framesBounds.size(); i++) {
          archive.obj(*framesBounds[i]);
        }
      });
      archive.str("selectedLayerId", selectedLayerId);
      archive.num("selectedFrame", selectedFrame.value);
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
    DrawDataLayer *selectedLayer();
    int getRealFrameIndexForLayerId(DrawDataLayerId layerId, int frame);
    int getRealFrameIndexForLayerId(DrawDataLayerId layerId, OneIndexFrame frame);
    DrawDataLayer *layerForId(DrawDataLayerId id);
    DrawDataFrame *currentLayerFrame();
    PathDataList *currentPathDataList();
    void clearBounds();
    void updateSelectedFrameBounds();
    Bounds getBounds(int frame);
    bool arePathDatasFloodFillable(PathData &pd1, PathData &pd2);
    void updateFramePreview();
    AnimationState newAnimationState();
    int getNumFrames();
    int modFrameIndex(int value);
    int modFrameIndex(OneIndexFrame frame);
    struct RunAnimationResult {
      bool loop = false;
      bool end = false;
      bool changed = false;
    };
    RunAnimationResult runAnimation(AnimationState &animationState,
        AnimationComponentProperties &componentProperties, float dt);
    ToveGraphicsHolder *graphics();
    void preload();
    void renderFrameIndex(int frameIdx /* zero index */);
    void render(std::optional<AnimationComponentProperties> componentProperties);
    void renderOnionSkinning();
    bool isPointInBounds(Point point);

    void addLayer(std::string title, DrawDataLayerId id);
    bool deleteLayer(DrawDataLayerId id);
    void setLayerOrder(DrawDataLayerId id, int newIndexInLayers);

    void addFrame();
    void addFrame(OneIndexFrame frameIndex);
    bool deleteFrame(OneIndexFrame frameIndex);
    void copyCell(DrawDataLayerId sourceLayerId, OneIndexFrame sourceFrameIndex,
        DrawDataLayerId destLayerId, OneIndexFrame destFrameIndex);
    void setCellLinked(DrawDataLayerId layerId, OneIndexFrame frameIndex, bool isLinked);
  };

}
}


#endif /* DrawData_hpp */
