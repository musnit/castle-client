//
//  DrawData.cpp
//  liblove-ios
//
//  Created by Jesse Ruder on 1/27/21.
//

#include "DrawData.hpp"
#include "DrawAlgorithms.hpp"
#include "Ghost.hpp"

namespace love {
namespace ghost {

  love::Type DrawData::type("DrawData", &Ghost::type);

  float DrawData::gridCellSize() {
    return gridSize;
  }

  std::tuple<float, float> DrawData::globalToGridCoordinates(float x, float y) {
    float gridX = x / gridCellSize();
    float gridY = y / gridCellSize();
    return { gridX, gridY };
  }

  std::tuple<float, float> DrawData::gridToGlobalCoordinates(float x, float y) {
    auto globalX = x * gridCellSize();
    auto globalY = y * gridCellSize();
    return { globalX, globalY };
  }

  std::tuple<float, float> DrawData::roundGlobalDiffCoordinatesToGrid(float x, float y) {
    auto [gridX, gridY] = globalToGridCoordinates(x, y);
    gridX = round(gridX);
    gridY = round(gridY);
    return gridToGlobalCoordinates(gridX, gridY);
  }

  std::tuple<float, float> DrawData::roundGlobalCoordinatesToGrid(float x, float y) {
    auto [gridX, gridY] = globalToGridCoordinates(x, y);
    gridX = round(gridX);
    gridY = round(gridY);

    auto [resultX, resultY] = gridToGlobalCoordinates(gridX, gridY);
    return clampGlobalCoordinates(resultX, resultY);
  }

  std::tuple<float, float> DrawData::clampGlobalCoordinates(float x, float y) {
    if (x < -DRAW_MAX_SIZE) {
      x = -DRAW_MAX_SIZE;
    } else if (x > DRAW_MAX_SIZE) {
      x = DRAW_MAX_SIZE;
    }
    if (y < -DRAW_MAX_SIZE) {
      y = -DRAW_MAX_SIZE;
    } else if (y > DRAW_MAX_SIZE) {
      y = DRAW_MAX_SIZE;
    }
    return { x, y };
  }

  float DrawData::roundGlobalDistanceToGrid(float d) {
    auto [x, y] = roundGlobalCoordinatesToGrid(d, 0);
    return x;
  }

  void DrawData::makeSubpathsFromSubpathData(PathData *pathData) {
    for (size_t i = 0; i < pathData->subpathDataList.size(); i++) {
      auto subpathData = pathData->subpathDataList[i];
      auto subpath = NewSubpath();
      pathData->toveSubpaths.push_back(subpath);
      PathAddSubpath(pathData->tovePath, subpath);
      if (subpathData.type == line) {
        SubpathMoveTo(subpath, subpathData.p1.x, subpathData.p1.y);
        SubpathLineTo(subpath, subpathData.p2.x, subpathData.p2.y);
      } else if (subpathData.type == arc) {
        SubpathArc(subpath, subpathData.center.x, subpathData.center.y, subpathData.radius,
            (subpathData.startAngle * 180) / M_PI, (subpathData.endAngle * 180) / M_PI, false);
      }
    }
  }

  void DrawData::addLineSubpathData(
      PathData *pathData, float p1x, float p1y, float p2x, float p2y) {
    Subpath subpath;
    subpath.type = line;
    subpath.p1 = Point(p1x, p1y);
    subpath.p2 = Point(p2x, p2y);

    pathData->subpathDataList.push_back(subpath);
  }

  void DrawData::addCircleSubpathData(PathData *pathData, float centerX, float centerY,
      float radius, float startAngle, float endAngle) {
    Subpath subpath;
    subpath.type = arc;
    subpath.center = Point(centerX, centerY);
    subpath.radius = radius;
    subpath.startAngle = startAngle;
    subpath.endAngle = endAngle;

    pathData->subpathDataList.push_back(subpath);
  }

  void DrawData::drawEndOfArc(PathData *pathData, float p1x, float p1y, float p2x, float p2y) {
    if (p1x == p2x && p1y == p2y) {
      return;
    }
    addLineSubpathData(pathData, p1x, p1y, p2x, p2y);
  }

  void DrawData::addSubpathDataForPoints(PathData *pathData, Point p1, Point p2) {
    auto style = pathData->style;
    auto bendPointOptional = pathData->bendPoint;
    if (bendPointOptional) {
      auto bendPoint = *bendPointOptional;
      auto midpointP1P2 = Point((p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
      auto radiusP1P2 = sqrt(pow(p1.x - p2.x, 2) + pow(p1.y - p2.y, 2)) / 2;
      auto distFromMidpointToBendPoint
          = sqrt(pow(midpointP1P2.x - bendPoint.x, 2) + pow(midpointP1P2.y - bendPoint.y, 2));
      if (distFromMidpointToBendPoint > radiusP1P2) {
        auto scaleAmt = radiusP1P2 / distFromMidpointToBendPoint;
        bendPoint = Point(((bendPoint.x - midpointP1P2.x) * scaleAmt) + midpointP1P2.x,
            ((bendPoint.y - midpointP1P2.y) * scaleAmt) + midpointP1P2.y);
      }
      auto p1NormalVector = Point(-(bendPoint.y - p1.y), bendPoint.x - p1.x);
      auto p2NormalVector = Point(-(bendPoint.y - p2.y), bendPoint.x - p2.x);
      auto p1Midpoint = Point((bendPoint.x + p1.x) / 2, (bendPoint.y + p1.y) / 2);
      auto p2Midpoint = Point((bendPoint.x + p2.x) / 2, (bendPoint.y + p2.y) / 2);
      auto rayIntersectionResult = DrawAlgorithms::rayRayIntersection(p1Midpoint.x, p1Midpoint.y,
          p1Midpoint.x + p1NormalVector.x, p1Midpoint.y + p1NormalVector.y, p2Midpoint.x,
          p2Midpoint.y, p2Midpoint.x + p2NormalVector.x, p2Midpoint.y + p2NormalVector.y);
      if (!rayIntersectionResult) {
        addLineSubpathData(pathData, p1.x, p1.y, p2.x, p2.y);
        return;
      }
      auto circleCenterX = rayIntersectionResult->first;
      auto circleCenterY = rayIntersectionResult->second;

      auto radius = sqrt(pow(p1.y - circleCenterY, 2) + pow(p1.x - circleCenterX, 2));
      if (radius > 50.0) {
        addLineSubpathData(pathData, p1.x, p1.y, p2.x, p2.y);
        return;
      }
      auto angle1 = atan2(p1.y - circleCenterY, p1.x - circleCenterX);
      auto angleBendPoint = atan2(bendPoint.y - circleCenterY, bendPoint.x - circleCenterX);
      auto angle2 = atan2(p2.y - circleCenterY, p2.x - circleCenterX);
      float startAngle;
      float endAngle;
      if (DrawAlgorithms::isAngleBetween(angleBendPoint, angle1, angle2)) {
        startAngle = angle1;
        endAngle = angle2;
      } else {
        startAngle = angle2;
        endAngle = angle1;
      }
      addCircleSubpathData(pathData, circleCenterX, circleCenterY, radius, startAngle, endAngle);
    } else {
      if (style == 1) {
        addLineSubpathData(pathData, p1.x, p1.y, p2.x, p2.y);
        return;
      }
      auto isOver = style == 2;
      if (p1.x > p2.x || (p1.x == p2.x && p1.y > p2.y)) {
        auto t = p1;
        p1 = p2;
        p2 = t;
      }
      auto radius = fmin(abs(p2.x - p1.x), abs(p2.y - p1.y));
      auto xIsLonger = abs(p2.x - p1.x) > abs(p2.y - p1.y);
      if (radius == 0) {
        radius = sqrt(pow(p2.x - p1.x, 2) + pow(p2.y - p1.y, 2)) / 2;
        auto circleCenter = Point((p2.x + p1.x) / 2, (p2.y + p1.y) / 2);
        float startAngle;
        if (p1.x == p2.x) {
          if (isOver) {
            startAngle = (M_PI * 3) / 2;
          } else {
            startAngle = M_PI / 2;
          }
        } else {
          if (isOver) {
            startAngle = M_PI;
          } else {
            startAngle = 0;
          }
        }
        auto testPoint = Point(circleCenter.x + (cos(startAngle + (M_PI / 2)) * radius),
            circleCenter.y + (sin(startAngle + (M_PI / 2)) * radius));
        if (!isPointInBounds(testPoint)) {
          pathData->style = pathData->style + 1;
          if (pathData->style > 3) {
            pathData->style = 1;
          }
          ReleasePath(pathData->tovePath);
          pathData->tovePath.ptr = NULL;
          updatePathDataRendering(pathData);
          return;
        }
        addCircleSubpathData(
            pathData, circleCenter.x, circleCenter.y, radius, startAngle, startAngle + (M_PI / 2));
        addCircleSubpathData(pathData, circleCenter.x, circleCenter.y, radius,
            startAngle + (M_PI / 2), startAngle + M_PI);
      } else {
        Point circleCenter;
        float startAngle;
        if (p1.y > p2.y) {
          startAngle = 0;
          if (isOver) {
            startAngle = startAngle + M_PI;
          }
          if (xIsLonger) {
            if (isOver) {
              circleCenter.x = p1.x + radius;
              circleCenter.y = p2.y + radius;
              drawEndOfArc(pathData, p1.x + radius, p2.y, p2.x, p2.y);
            } else {
              circleCenter.x = p2.x - radius;
              circleCenter.y = p1.y - radius;
              drawEndOfArc(pathData, p1.x, p1.y, p2.x - radius, p1.y);
            }
          } else {
            if (isOver) {
              circleCenter.x = p1.x + radius;
              circleCenter.y = p2.y + radius;
              drawEndOfArc(pathData, p1.x, p1.y, p1.x, p2.y + radius);
            } else {
              circleCenter.x = p2.x - radius;
              circleCenter.y = p1.y - radius;
              drawEndOfArc(pathData, p2.x, p1.y - radius, p2.x, p2.y);
            }
          }
        } else {
          startAngle = M_PI / 2;
          if (isOver) {
            startAngle = startAngle + M_PI;
          }
          if (xIsLonger) {
            if (isOver) {
              circleCenter.x = p2.x - radius;
              circleCenter.y = p1.y + radius;
              drawEndOfArc(pathData, p1.x, p1.y, p2.x - radius, p1.y);
            } else {
              circleCenter.x = p1.x + radius;
              circleCenter.y = p2.y - radius;
              drawEndOfArc(pathData, p1.x + radius, p2.y, p2.x, p2.y);
            }
          } else {
            if (isOver) {
              circleCenter.x = p2.x - radius;
              circleCenter.y = p1.y + radius;
              drawEndOfArc(pathData, p2.x, p1.y + radius, p2.x, p2.y);
            } else {
              circleCenter.x = p1.x + radius;
              circleCenter.y = p2.y - radius;
              drawEndOfArc(pathData, p1.x, p1.y, p1.x, p2.y - radius);
            }
          }
        }
        addCircleSubpathData(
            pathData, circleCenter.x, circleCenter.y, radius, startAngle, startAngle + (M_PI / 2));
      }
    }
  }

  void DrawData::updatePathDataRendering(PathData *pathData) {
    if (pathData->tovePath.ptr != NULL) {
      return;
    }
    TovePathRef path = NewPath(NULL);
    if (pathData->color) {
      auto col = NewColor(
          pathData->color->r, pathData->color->g, pathData->color->b, 1);
      PathSetLineColor(path, col);
      ReleasePaint(col);
    } else {
      auto col = NewColor(lineColor.r, lineColor.g, lineColor.b, 1);
      PathSetLineColor(path, col);
      ReleasePaint(col);
    }

    PathSetLineWidth(path, DRAW_LINE_WIDTH);
    PathSetMiterLimit(path, 1.0);
    PathSetLineJoin(path, TOVE_LINEJOIN_ROUND);
    pathData->tovePath = path;

    pathData->subpathDataList.clear();
    if (pathData->isTransparent) {
      return;
    }
    for (size_t i = 0; i + 1 < pathData->points.size(); i++) {
      auto p1 = pathData->points[i];
      auto p2 = pathData->points[i + 1];
      addSubpathDataForPoints(pathData, p1, p2);
    }
    makeSubpathsFromSubpathData(pathData);
  }

  DrawDataLayer *DrawData::selectedLayer() {
    return layerForId(selectedLayerId);
  }

  int DrawData::getRealFrameIndexForLayerId(DrawDataLayerId layerId, OneIndexFrame oneIndexFrame) {
    auto layer = layerForId(layerId);
    int frame = modFrameIndex(oneIndexFrame);
    while (frame >= 0) {
      if (!layer->frames[frame]->isLinked) {
        return frame;
      }
      frame = frame - 1;
    }
    return frame;
  }

  int DrawData::getRealFrameIndexForLayerId(DrawDataLayerId layerId, int frame) {
    auto layer = layerForId(layerId);
    frame = modFrameIndex(frame);
    while (frame >= 0) {
      if (!layer->frames[frame]->isLinked) {
        return frame;
      }
      frame = frame - 1;
    }
    return frame;
  }

  DrawDataLayer *DrawData::layerForId(DrawDataLayerId id) {
    for (size_t i = 0; i < layers.size(); i++) {
      if (layers[i]->id == id) {
        return layers[i].get();
      }
    }

    throw;
  }

  DrawDataFrame *DrawData::currentLayerFrame() {
    auto realFrame = getRealFrameIndexForLayerId(selectedLayer()->id, selectedFrame);
    return selectedLayer()->frames[realFrame].get();
  }

  PathDataList *DrawData::currentPathDataList() {
    return &currentLayerFrame()->pathDataList;
  }
  /*
  TYPE DrawData::new(TYPE obj) {
    if (!obj || obj == null) {
          obj = {
            version = 2;
          }
    }
    auto newObj = {
          _graphics = null;
          _graphicsNeedsReset = true;
          pathDataList = obj.pathDataList || [];
          color = obj.color || obj.fillColor || [hexStringToRgb("f9a31b")];
          lineColor = obj.lineColor || [hexStringToRgb("f9a31b")];
          gridSize = obj.gridSize || 0.71428571428571;
          scale = obj.scale || DRAW_DATA_SCALE;
          pathsCanvas = null;
          fillImageData = null;
          fillImage = null;
          fillImageBounds = obj.fillImageBounds || {
            maxX = 0;
            maxY = 0;
            minX = 0;
            minY = 0;
          }
          fillCanvasSize = obj.fillCanvasSize || FILL_CANVAS_SIZE;
          fillPng = obj.fillPng || null;
          version = obj.version || null;
          fillPixelsPerUnit = obj.fillPixelsPerUnit || 25.6;
          bounds = obj.bounds || null;
          framesBounds = obj.framesBounds || [];
          layers = obj.layers || [];
          numTotalLayers = obj.numTotalLayers || 1;
          selectedLayerId = obj.selectedLayerId || null;
          selectedFrame = obj.selectedFrame || 1;
          _layerDataChanged = true;
          _layerData = null;
    }
    printObject(newObj);
    love.ghost.loadDrawData(newObj);
    for (int l = 0; l < newObj.layers.length; l++) {
          for (int f = 0; f < newObj.layers[l].frames.length; f++) {
            auto frame = newObj.layers[l].frames[f];
            frame.pathsCanvas = null;
            frame.fillImageData = null;
            frame.fillImage = null;
          }
    }
    newObj = util.deepCopyTable(newObj);
    setmetatable(newObj, self);
    __index = self;
    newObj.migrateV1ToV2();
    newObj.migrateV2ToV3();
    newObj.clearGraphics();
    setmetatable(newObj, self);
    __index = self;
    for (int l = 0; l < newObj.layers.length; l++) {
          auto layer = newObj.layers[l];
          if (layer.isVisible == null) {
            layer.isVisible = true;
          }
          if (!layer.id) {
            layer.id = "layer" + l;
          }
          for (int f = 0; f < newObj.layers[l].frames.length; f++) {
            auto frame = newObj.layers[l].frames[f];
            setmetatable(frame, {
                  __index = DrawDataFrame;
            });
            frame.parent = undefined;
            frame.deserializePathDataList();
          }
    }
    if (newObj.selectedLayerId == null) {
          newObj.selectedLayerId = newObj.layers[0].id;
    }
    newObj.graphics();
    for (int l = 0; l < newObj.layers.length; l++) {
          for (int f = 0; f < newObj.layers[l].frames.length; f++) {
            auto frame = newObj.layers[l].frames[f];
            frame.deserializeFillAndPreview();
          }
    }
    return newObj;
  }

  TYPE DrawData::migrateV1ToV2() {
    if (version != null && version >= 2) {
          return;
    }
    version = 2;
    gridSize = scale / (gridSize - 1);
    bounds = {
          minX = -scale / 2;
          minY = -scale / 2;
          maxX = scale / 2;
          maxY = scale / 2;
    }
    fillImageBounds = {
          minX = (fillPixelsPerUnit * -scale) / 2;
          minY = (fillPixelsPerUnit * -scale) / 2;
          maxX = (fillPixelsPerUnit * scale) / 2;
          maxY = (fillPixelsPerUnit * scale) / 2;
    }
    for (int i = 0; i < pathDataList.length; i++) {
          auto pathData = pathDataList[i];
          for (int j = 0; j < pathData.points.length; j++) {
            pathData.points[j].x = pathData.points[j].x - (scale / 2);
            pathData.points[j].y = pathData.points[j].y - (scale / 2);
          }
          if (pathData.bendPoint) {
            pathData.bendPoint.x = pathData.bendPoint.x - (scale / 2);
            pathData.bendPoint.y = pathData.bendPoint.y - (scale / 2);
          }
    }
    auto boundsPathData1 = [];
    boundsPathData1.points = Point(Point(-scale / 2, -scale / 2), Point(-scale / 2, -scale / 2));
    boundsPathData1.style = -1;
    boundsPathData1.isFreehand = true;
    boundsPathData1.isTransparent = true;
    auto boundsPathData2 = [];
    boundsPathData2.points = Point(Point(scale / 2, scale / 2), Point(scale / 2, scale / 2));
    boundsPathData2.style = -1;
    boundsPathData2.isFreehand = true;
    boundsPathData2.isTransparent = true;
    pathDataList.push_back(boundsPathData1);
    pathDataList.push_back(boundsPathData2);
  }

  TYPE DrawData::migrateV2ToV3() {
    if (version >= 3 && layers.length > 0) {
          return;
    }
    version = 3;
    frames = 1;
    layers = [{
          title = "Layer 1";
          frames = [util.deepCopyTable({
            pathDataList = pathDataList;
            pathsCanvas = pathsCanvas;
            fillImageData = fillImageData;
            fillImage = fillImage;
            fillImageBounds = fillImageBounds;
            fillCanvasSize = fillCanvasSize;
            fillPng = fillPng;
          })];
    }];
    pathDataList = null;
    pathsCanvas = null;
    fillImageData = null;
    fillImage = null;
    fillImageBounds = null;
    fillCanvasSize = null;
    fillPng = null;
    framesBounds = [bounds];
    bounds = null;
  }*/

  void DrawData::clearBounds() {
    framesBounds.clear();
    if (getNumLayers()) {
      for (int ii = 0, numFrames = layers[0]->frames.size(); ii < numFrames; ii++) {
        framesBounds.push_back(std::nullopt);
      }
    }
  }

  void DrawData::updateSelectedFrameBounds() {
    framesBounds[selectedFrame.value - 1] = std::nullopt;
  }

  Bounds DrawData::getBounds(int frame) {
    if (framesBounds[frame]) {
      return *framesBounds[frame];
    }
    std::optional<Bounds> bounds = std::nullopt;
    for (size_t l = 0; l < layers.size(); l++) {
      auto layer = layers[l].get();
      auto realFrame = getRealFrameIndexForLayerId(layer->id, frame);
      auto frame = layer->frames[realFrame].get();
      bounds = frame->getPathDataBounds(bounds);
    }
    framesBounds[frame] = bounds;
    return *bounds;
  }

  bool DrawData::arePathDatasFloodFillable(PathData &pd1, PathData &pd2) {
    if (!DrawAlgorithms::coordinatesEqual(pd1.points[pd1.points.size() - 1], pd2.points[0])) {
      return false;
    }
    if (!DrawAlgorithms::colorsEqual(pd1.color, pd2.color)) {
      return false;
    }
    return true;
  }

  /*
  void DrawData::saveEditorSettings() {
    auto result = [];
    return result;
  }

  void DrawData::applyEditorSettings(TYPE editorSettings) {
    if (!editorSettings) {
          return;
    }
  }*/

  /*
  TYPE DrawData::serialize() {
    for (int i = 0; i < getNumFrames(); i++) {
          getBounds(i);
    }
    auto data = {
          pathDataList = [];
          color = color;
          lineColor = lineColor;
          gridSize = gridSize;
          scale = scale;
          version = version;
          fillPixelsPerUnit = fillPixelsPerUnit;
          numTotalLayers = numTotalLayers;
          layers = [];
          framesBounds = framesBounds;
          selectedLayerId = selectedLayerId;
          selectedFrame = selectedFrame;
    }
    for (int l = 0; l < layers.length; l++) {
          auto layerData = {
            title = layers[l].title;
            id = layers[l].id;
            isVisible = layers[l].isVisible;
            frames = [];
          }
          for (int f = 0; f < layers[l].frames.length; f++) {
            auto frame = layers[l].frames[f];
            layerData.frames.push_back(frame.serialize());
          }
          data.layers.push_back(layerData);
    }
    return data;
  }
*/

  void DrawData::addLayer(std::string title, DrawDataLayerId id) {
    auto newLayer = std::make_unique<DrawDataLayer>(title, id);

    auto frameCount = layers.size() > 0 ? layers[0]->frames.size() : 1;
    for (int i = 0; i < frameCount; i++) {
      auto newFrame = std::make_unique<DrawDataFrame>(i > 0);
      newLayer->frames.push_back(std::move(newFrame));
    }

    selectedLayerId = newLayer->id;
    newLayer->setParent(this);
    layers.push_back(std::move(newLayer));
  }

  bool DrawData::deleteLayer(DrawDataLayerId id) {
    int indexToRemove = -1;
    for (int ii = 0; ii < layers.size(); ii++) {
      if (layers[ii]->id == id) {
        indexToRemove = ii;
        break;
      }
    }
    if (indexToRemove >= 0) {
      layers.erase(layers.begin() + indexToRemove);
      if (selectedLayerId == id) {
        if (indexToRemove < getNumLayers()) {
          selectedLayerId = layers[indexToRemove]->id;
        } else if (indexToRemove > 0) {
          selectedLayerId = layers[indexToRemove - 1]->id;
        } else if (getNumLayers() > 0) {
          selectedLayerId = layers[0]->id;
        } else {
          selectedLayerId = "";
        }
      }
      return true;
    }
    return false;
  }

  void DrawData::setLayerOrder(DrawDataLayerId id, int newIndexInLayers) {
    int indexToMove = -1;
    for (int ii = 0; ii < layers.size(); ii++) {
      if (layers[ii]->id == id) {
        indexToMove = ii;
        break;
      }
    }
    if (newIndexInLayers == indexToMove - 1 || newIndexInLayers == indexToMove + 1) {
      std::iter_swap(layers.begin() + indexToMove, layers.begin() + newIndexInLayers);
    }
    // TODO: support arbitrary moves
  }

  void DrawData::addFrame() {
    OneIndexFrame lastFrameIndex;
    lastFrameIndex.setFromZeroIndex(layers[0]->frames.size());
    addFrame(lastFrameIndex);
  }

  void DrawData::addFrame(OneIndexFrame frameIndex) {
    if (getNumLayers()) {
      auto isLinked = layers[0]->frames.size() > 0;
      auto zeroFrameIndex = frameIndex.toZeroIndex();
      for (auto &layer : layers) {
        auto newFrame = std::make_unique<DrawDataFrame>(isLinked);
        if (zeroFrameIndex >= layer->frames.size()) {
          layer->frames.push_back(std::move(newFrame));
        } else {
          // can't use frames->insert() without freeing the std::unique reference on the moved elems
          layer->frames.push_back(std::move(newFrame));
          std::iter_swap(layer->frames.begin() + zeroFrameIndex, layer->frames.rbegin());
        }
      }
      selectedFrame.setFromZeroIndex(zeroFrameIndex);
    }
  }

  bool DrawData::deleteFrame(OneIndexFrame frameIndex) {
    clearBounds();
    auto zeroIndexFrame = frameIndex.toZeroIndex();
    if (getNumLayers()) {
      for (auto &layer : layers) {
        layer->frames.erase(layer->frames.begin() + zeroIndexFrame);
      }
      if (layers[0]->frames.empty()) {
        addFrame();
      }
      if (selectedFrame.toZeroIndex() >= layers[0]->frames.size()) {
        selectedFrame.setFromZeroIndex(layers[0]->frames.size() - 1);
      }
      return true;
    }
    return false;
  }

  void DrawData::updateFramePreview() {
    currentLayerFrame()->base64Png = currentLayerFrame()->renderPreviewPng(-1);
  }

  void DrawData::copyCell(DrawDataLayerId sourceLayerId, OneIndexFrame sourceFrameIndex,
      DrawDataLayerId destLayerId, OneIndexFrame destFrameIndex) {
    auto sourceLayer = layerForId(sourceLayerId), destLayer = layerForId(destLayerId);
    if (sourceFrameIndex.toZeroIndex() < sourceLayer->frames.size()
        && destFrameIndex.toZeroIndex() < destLayer->frames.size()) {
      auto &oldFrame = sourceLayer->frames[sourceFrameIndex.toZeroIndex()];
      destLayer->frames[destFrameIndex.toZeroIndex()] = std::make_unique<DrawDataFrame>(*oldFrame);
    }
  }

  void DrawData::setCellLinked(DrawDataLayerId layerId, OneIndexFrame frameIndex, bool isLinked) {
    if (frameIndex.value < 2) {
      return;
    }
    auto layer = layerForId(layerId);
    if (layer->frames[frameIndex.toZeroIndex()]->isLinked == isLinked) {
      return;
    }
    if (isLinked) {
      auto newFrame = std::make_unique<DrawDataFrame>(true);
      layer->frames[frameIndex.toZeroIndex()] = std::move(newFrame);
    } else {
      OneIndexFrame realFrameIndex;
      realFrameIndex.setFromZeroIndex(getRealFrameIndexForLayerId(layerId, frameIndex));
      copyCell(layerId, realFrameIndex, layerId, frameIndex);
    }
  }

  AnimationState DrawData::newAnimationState() {
    AnimationState state;
    state.animationFrameTime = 0.0;
    return state;
  }

  int DrawData::getNumFrames() {
    return layers[0]->frames.size();
  }

  int DrawData::modFrameIndex(int value) {
    auto numFrames = getNumFrames();
    value = value % numFrames;
    if (value < 0) {
      value = value + numFrames;
    }
    return value;
  }

  int DrawData::modFrameIndex(OneIndexFrame frame) {
    return modFrameIndex(frame.value - 1);
  }

  DrawData::RunAnimationResult DrawData::runAnimation(
      AnimationState &animationState, AnimationComponentProperties &componentProperties, float dt) {
    RunAnimationResult result;
    if (!componentProperties.playing) {
      return result;
    }
    animationState.animationFrameTime = animationState.animationFrameTime + dt;
    auto secondsPerFrame = 1 / componentProperties.framesPerSecond;
    if (animationState.animationFrameTime > abs(secondsPerFrame)) {
      animationState.animationFrameTime = animationState.animationFrameTime - abs(secondsPerFrame);
      auto firstFrame = componentProperties.loopStartFrame.toZeroIndex();
      if (firstFrame < 0 || firstFrame >= getNumFrames()) {
        firstFrame = 0;
      }
      auto lastFrame = componentProperties.loopEndFrame.toZeroIndex();
      if (lastFrame < 0 || lastFrame >= getNumFrames()) {
        lastFrame = getNumFrames() - 1;
      }
      auto currentFrame = modFrameIndex(componentProperties.currentFrame);
      if (secondsPerFrame > 0) {
        if (currentFrame == lastFrame) {
          if (componentProperties.loop) {
            componentProperties.currentFrame.setFromZeroIndex(firstFrame);
            result.changed = true;
            result.loop = true;
          } else {
            componentProperties.playing = false;
            animationState.animationFrameTime = 0;
            result.end = true;
          }
        } else {
          componentProperties.currentFrame.setFromZeroIndex(currentFrame + 1);
          result.changed = true;
        }
      } else {
        if (currentFrame == firstFrame) {
          if (componentProperties.loop) {
            componentProperties.currentFrame.setFromZeroIndex(lastFrame);
            result.changed = true;
            result.loop = true;
          } else {
            componentProperties.playing = false;
            animationState.animationFrameTime = 0;
            result.end = true;
          }
        } else {
          componentProperties.currentFrame.setFromZeroIndex(currentFrame - 1);
          result.changed = true;
        }
      }
    }
    return result;
  }
  /*
  TYPE DrawData::clearFrame() {
    auto realFrame = getRealFrameIndexForLayerId(selectedLayer().id, selectedFrame);
    selectedLayer().frames[realFrame] = _newFrame(false);
  }*/

  ToveGraphicsHolder *DrawData::graphics() {
    return currentLayerFrame()->graphics();
  }

  void DrawData::preload() {
    graphics();
  }

  void DrawData::renderFrameIndex(int frameIdx /* zero index */) {
    for (size_t l = 0; l < layers.size(); l++) {
      if (layers[l]->isVisible) {
        auto realFrame = getRealFrameIndexForLayerId(layers[l]->id, frameIdx);
        auto frame = layers[l]->frames[realFrame].get();
        frame->renderFill();
        frame->graphics()->draw();
      }
    }
  }

  void DrawData::render(std::optional<AnimationComponentProperties> componentProperties) {
    int frameIdx = selectedFrame.toZeroIndex();
    if (componentProperties) {
      frameIdx = modFrameIndex(componentProperties->currentFrame);
    }
    renderFrameIndex(frameIdx);
  }

  void DrawData::renderOnionSkinning() {
    int prevFrameIdx = modFrameIndex(selectedFrame.toZeroIndex() - 1);
    renderFrameIndex(prevFrameIdx);
  }

  /*

  TYPE DrawData::renderForTool(TYPE animationState, TYPE tempTranslateX, TYPE tempTranslateY, TYPE
  tempGraphics) { auto frameIdx = selectedFrame; if (animationState) { frameIdx =
  animationState.currentFrame;
    }
    for (int l = 0; l < layers.length; l++) {
          auto layer = layers[l];
          auto realFrame = getRealFrameIndexForLayerId(layer.id, frameIdx);
          auto frame = layers[l].frames[realFrame];
          if (layer.isVisible) {
            if (layer.id == selectedLayerId) {
                  love.graphics.push();
                  love.graphics.translate(tempTranslateX, tempTranslateY);
                  frame.renderFill();
                  frame.graphics().draw();
                  love.graphics.pop();
                  if (tempGraphics != null) {
                    tempGraphics.draw();
                  }
            } else {
                  frame.renderFill();
                  frame.graphics().draw();
            }
          }
    }
  }

  TYPE DrawData::renderPreviewPngForFrames(TYPE size) {
    auto results = {
          numFrames = layers[0].frames.length;
    }
    for (int i = 0; i < layers[0].frames.length; i++) {
          results["frame" + (i - 1)] = renderPreviewPng(i, size);
    }
    return results;
  }

  TYPE DrawData::function() {
    auto pathBounds = getBounds(frame);
    auto width = pathBounds.maxX - pathBounds.minX;
    auto height = pathBounds.maxY - pathBounds.minY;
    auto maxDimension = width;
    if (height > maxDimension) {
          maxDimension = height;
    }
    auto widthPadding = (maxDimension - width) / 2;
    auto heightPadding = (maxDimension - height) / 2;
    auto padding = maxDimension * 0.025;
    love.graphics.push("all");
    love.graphics.origin();
    love.graphics.scale(size / (maxDimension * 1.05));
    love.graphics.translate((padding - pathBounds.minX) + widthPadding, (padding - pathBounds.minY)
  + heightPadding); love.graphics.clear(0, 0, 0, 0); love.graphics.setColor(1, 1, 1, 1); render({
          currentFrame = frame;
    });
    love.graphics.pop();
  }

  TYPE DrawData::renderPreviewPng(TYPE frame, TYPE size) {
    if (!size) {
          size = 256;
    }
    auto previewCanvas = love.graphics.newCanvas(size, size, {
          dpiscale = 1;
          msaa = 4;
    });
    previewCanvas.renderTo(undefined);
    auto fileData = previewCanvas.newImageData().encode("png");
    return love.data.encode("string", "base64", fileData.getString());
  }

  TYPE DrawData::clearGraphics() {
    for (int l = 0; l < layers.length; l++) {
          for (int f = 0; f < layers[l].frames.length; f++) {
            auto frame = layers[l].frames[f];
            frame._graphics = null;
            frame._graphicsNeedsReset = true;
            for (int i = 0; i < frame.pathDataList.length; i++) {
                  frame.pathDataList[i].tovePath = null;
                  frame.pathDataList[i].subpathDataList = null;
            }
          }
    }
  }

  TYPE DrawData::updateColor(TYPE r, TYPE g, TYPE b) {
    if (r == color[0] && g == color[1] && b == color[2]) {
          return false;
    }
    color[0] = r;
    color[1] = g;
    color[2] = b;
    return true;
  }*/

  bool DrawData::isPointInBounds(Point point) {
    return point.x >= -DRAW_MAX_SIZE && point.x <= DRAW_MAX_SIZE && point.y >= -DRAW_MAX_SIZE
        && point.y <= DRAW_MAX_SIZE;
  }

}
}
