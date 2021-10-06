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
      auto col = NewColor(pathData->color->r, pathData->color->g, pathData->color->b, 1);
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
    return nullptr;
  }

  void DrawData::clearBounds() {
    framesBounds.clear();
    if (getNumLayers()) {
      for (int ii = 0, numFrames = layers[0]->frames.size(); ii < numFrames; ii++) {
        framesBounds.push_back(std::nullopt);
      }
    }
  }

  void DrawData::updateFrameBounds(OneIndexFrame frameIndex) {
    framesBounds[frameIndex.toZeroIndex()] = std::nullopt;
  }

  Bounds DrawData::getBounds(int frame) {
    if (framesBounds[frame].has_value()) {
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
    if (pd1.points.size() == 0 || pd2.points.size() == 0) {
      return false;
    }
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

  void DrawData::addLayer(std::string title, DrawDataLayerId id, int order) {
    auto newLayer = std::make_shared<DrawDataLayer>(title, id);

    auto frameCount = layers.size() > 0 ? layers[0]->frames.size() : 1;
    for (int i = 0; i < frameCount; i++) {
      auto newFrame = std::make_shared<DrawDataFrame>(i > 0, this);
      newLayer->frames.push_back(std::move(newFrame));
    }

    newLayer->setParent(this);
    layers.push_back(std::move(newLayer));
    if (order > -1 && order < layers.size() - 1) {
      std::iter_swap(layers.begin() + order, layers.rbegin());
    }
  }

  int DrawData::deleteLayer(const DrawDataLayerId &id) {
    int indexToRemove = -1;
    for (int ii = 0; ii < layers.size(); ii++) {
      if (layers[ii]->id == id) {
        indexToRemove = ii;
        break;
      }
    }
    if (indexToRemove >= 0) {
      layers.erase(layers.begin() + indexToRemove);
    }
    return indexToRemove;
  }

  void DrawData::setLayerOrder(const DrawDataLayerId &id, int newIndexInLayers) {
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
        auto newFrame = std::make_shared<DrawDataFrame>(isLinked, this);
        if (zeroFrameIndex >= layer->frames.size()) {
          layer->frames.push_back(std::move(newFrame));
        } else {
          // can't use frames->insert() without freeing the std::unique reference on the moved elems
          layer->frames.push_back(std::move(newFrame));
          std::iter_swap(layer->frames.begin() + zeroFrameIndex, layer->frames.rbegin());
        }
      }
    }

    // TODO: clear bounds isn't really necessary, just need to make sure the bounds are the correct
    // length
    clearBounds();
  }

  bool DrawData::deleteFrame(OneIndexFrame frameIndex) {
    auto zeroIndexFrame = frameIndex.toZeroIndex();
    if (getNumLayers()) {
      for (auto &layer : layers) {
        layer->frames.erase(layer->frames.begin() + zeroIndexFrame);
      }
      if (layers[0]->frames.empty()) {
        addFrame();
      }
      clearBounds();
      return true;
    }

    clearBounds();
    return false;
  }

  void DrawData::updateFramePreview(DrawDataLayerId layerId, OneIndexFrame frameIndex) {
    auto frame = layerForId(layerId)->frames[frameIndex.toZeroIndex()];
    frame->base64Png = frame->renderPreviewPng(-1);
  }

  void DrawData::copyCell(
      DrawDataFrame &sourceFrame, DrawDataLayerId destLayerId, OneIndexFrame destFrameIndex) {
    auto destLayer = layerForId(destLayerId);
    if (destLayer && destFrameIndex.toZeroIndex() < destLayer->frames.size()) {
      destLayer->frames[destFrameIndex.toZeroIndex()]
          = std::make_shared<DrawDataFrame>(sourceFrame);
    }
  }

  void DrawData::copyCell(DrawDataLayerId sourceLayerId, OneIndexFrame sourceFrameIndex,
      DrawDataLayerId destLayerId, OneIndexFrame destFrameIndex) {
    auto sourceLayer = layerForId(sourceLayerId), destLayer = layerForId(destLayerId);
    if (sourceLayer && destLayer && sourceFrameIndex.toZeroIndex() < sourceLayer->frames.size()
        && destFrameIndex.toZeroIndex() < destLayer->frames.size()) {
      auto &oldFrame = sourceLayer->frames[sourceFrameIndex.toZeroIndex()];
      destLayer->frames[destFrameIndex.toZeroIndex()] = std::make_shared<DrawDataFrame>(*oldFrame);
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
      auto newFrame = std::make_shared<DrawDataFrame>(true, this);
      layer->frames[frameIndex.toZeroIndex()] = std::move(newFrame);
    } else {
      OneIndexFrame realFrameIndex;
      realFrameIndex.setFromZeroIndex(getRealFrameIndexForLayerId(layerId, frameIndex));
      copyCell(layerId, realFrameIndex, layerId, frameIndex);
    }
  }

  void DrawData::clearFrame(DrawDataLayerId layerId, OneIndexFrame frameIndex) {
    auto realFrame = getRealFrameIndexForLayerId(layerId, frameIndex);
    auto selectedLayer = layerForId(layerId);
    auto emptyFrame = std::make_shared<DrawDataFrame>(false, this);
    selectedLayer->frames[realFrame] = std::move(emptyFrame);
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

  void DrawData::renderFrameIndex(int frameIdx /* zero index */) {
    frameIdx = modFrameIndex(frameIdx);
    for (size_t l = 0; l < layers.size(); l++) {
      if (layers[l]->isVisible) {
        auto realFrame = getRealFrameIndexForLayerId(layers[l]->id, frameIdx);
        auto frame = layers[l]->frames[realFrame].get();
        frame->renderFill();
        frame->graphics()->draw();
      }
    }
  }

  void DrawData::renderForTool(DrawDataLayerId layerId, OneIndexFrame frameIndex,
      float tempTranslateX, float tempTranslateY,
      std::shared_ptr<ToveGraphicsHolder> tempGraphics) {
    int frameIdx = frameIndex.toZeroIndex();

    for (size_t l = 0; l < layers.size(); l++) {
      auto layer = layers[l];
      auto realFrame = getRealFrameIndexForLayerId(layer->id, frameIdx);
      auto frame = layers[l]->frames[realFrame];
      if (layer->isVisible) {
        if (layer->id == layerId) {
          graphics::Graphics *graphicsModule
              = Module::getInstance<graphics::Graphics>(Module::M_GRAPHICS);

          graphicsModule->push(graphics::Graphics::STACK_TRANSFORM);
          graphicsModule->translate(tempTranslateX, tempTranslateY);
          frame->renderFill();
          frame->graphics()->draw();
          graphicsModule->pop();
          if (tempGraphics) {
            tempGraphics->draw();
          }
        } else {
          frame->renderFill();
          frame->graphics()->draw();
        }
      }
    }
  }

  std::optional<std::string> DrawData::renderPreviewPng(int frameIdx, int size) {
    if (size <= 0) {
      size = 256;
    }

    auto previewCanvas = DrawDataFrame::newCanvas(size, size);

    DrawDataFrame::renderToCanvas(previewCanvas, [this, frameIdx, size]() {
      auto pathBounds = getBounds(frameIdx);
      float width = pathBounds.maxX - pathBounds.minX;
      float height = pathBounds.maxY - pathBounds.minY;

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
          (padding - pathBounds.minX) + widthPadding, (padding - pathBounds.minY) + heightPadding);
      graphicsModule->clear(Colorf(0.0f, 0.0f, 0.0f, 0.0f), 0, 1.0);
      graphicsModule->setColor({ 1.0, 1.0, 1.0, 1.0 });

      renderFrameIndex(frameIdx);
      graphicsModule->pop();
    });

    auto result = DrawDataFrame::encodeBase64Png(previewCanvas);
    delete previewCanvas;
    return result;
  }

  bool DrawData::isPointInBounds(Point point) {
    return point.x >= -DRAW_MAX_SIZE && point.x <= DRAW_MAX_SIZE && point.y >= -DRAW_MAX_SIZE
        && point.y <= DRAW_MAX_SIZE;
  }

}
}
