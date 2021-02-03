//
//  DrawDataFrame.cpp
//  liblove-ios
//
//  Created by Jesse Ruder on 1/29/21.
//

#include "DrawDataFrame.hpp"
#include "DrawData.hpp"
#include "DrawAlgorithms.hpp"

namespace love
{
namespace ghost
{



void DrawDataFrame::deserializePathDataList() {
  /*auto newPathDataList = [];
  for (size_t i = 1; i < pathDataList.size(); i++) {
	auto pathData = pathDataList[i];
	if (pathData.points.size() > 2) {
	  auto pathData = util.deepCopyTable(pathData);
	  pathData.subpathDataList = null;
	  pathData.tovePath = null;
	  for (size_t j = 1; j < pathData.points.size() - 1; j++) {
		auto newPathData = util.deepCopyTable(pathData);
		newPathData.points = util.deepCopyTable(Point(pathData.points[j], pathData.points[j + 1]));
		newPathDataList.push_back(newPathData);
	  }
	} else {
	  newPathDataList.push_back(pathData);
	}
  }
  pathDataList = newPathDataList;*/
}
/*
TYPE DrawDataFrame::deserializeFillAndPreview() {
  if (fillPng) {
	auto fileDataString = love.data.decode("string", "base64", fillPng);
	auto fileData = love.filesystem.newFileData(fileDataString, "fill.png");
	fillImageData = love.image.newImageData(fileData);
  }
  base64Png = renderPreviewPng();
}*/

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
  for (size_t i = 1; i < a.size(); i++) {
	a[i] = round(a[i], 4);
  }
  return a;
}
/*
TYPE DrawDataFrame::serialize() {
  auto frameData = {
	isLinked = isLinked;
	pathDataList = [];
	fillImageBounds = fillImageBounds;
	fillCanvasSize = fillCanvasSize;
  }
  auto lastSerializedPathData = null;
  for (size_t i = 1; i < pathDataList.size(); i++) {
	auto pathData = pathDataList[i];
	auto serializedPathData = {
	  points = util.deepCopyTable(pathData.points);
	  style = pathData.style;
	  bendPoint = roundFloatArray(pathData.bendPoint);
	  isFreehand = pathData.isFreehand;
	  color = roundFloatArray(pathData.color);
	  isTransparent = pathData.isTransparent;
	}
	for (size_t j = 1; j < serializedPathData.points.size(); j++) {
	  serializedPathData.points[j].x = round(serializedPathData.points[j].x, 4);
	  serializedPathData.points[j].y = round(serializedPathData.points[j].y, 4);
	}
	if (lastSerializedPathData != null && arePathDatasMergable(lastSerializedPathData, serializedPathData)) {
	  lastSerializedPathData.points.push_back(serializedPathData.points[2]);
	} else {
	  frameData.pathDataList.push_back(serializedPathData);
	  lastSerializedPathData = serializedPathData;
	}
  }
  if (fillImageData) {
	auto fileData = fillImageData.encode("png");
	frameData.fillPng = love.data.encode("string", "base64", fileData.getString());
  }
  return frameData;
}*/

void DrawDataFrame::cleanUpPaths() {
  for (size_t i = 1; i < pathDataList.size(); i++) {
	parent()->updatePathDataRendering(pathDataList[i]);
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
  auto [minX, minY, maxX, maxY] = graphics().computeAABB();
  minX = minX + (DRAW_LINE_WIDTH / 2);
  minY = minY + (DRAW_LINE_WIDTH / 2);
  maxX = maxX - (DRAW_LINE_WIDTH / 2);
  maxY = maxY - (DRAW_LINE_WIDTH / 2);
  // we still need this because of isTransparent
  for (size_t i = 1; i < pathDataList.size(); i++) {
	auto pathData = pathDataList[i];
	for (size_t j = 1; j < pathData.points.size(); j++) {
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
	newBounds.minX = floor(bounds.minX * parent()->fillPixelsPerUnit);
	newBounds.minY = floor(bounds.minY * parent()->fillPixelsPerUnit);
	newBounds.maxX = ceil(bounds.maxX * parent()->fillPixelsPerUnit);
	newBounds.maxY = ceil(bounds.maxY * parent()->fillPixelsPerUnit);
	return newBounds;
}

void DrawDataFrame::resetGraphics() {
  _graphicsNeedsReset = true;
}
/*
TYPE DrawDataFrame::getFillImageDataSizedToPathBounds() {
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
  if (fillImageData == null) {
	fillImageData = love.image.newImageData(width, height);
  } else if (fillImageData.getWidth() != width || fillImageData.getHeight() != height) {
	auto newFillImageData = love.image.newImageData(width, height);
	// sourceX, sourceY, sourceWidth, sourceHeight, destX, destY
	newFillImageData.copyImageData(fillImageData, 0, 0, fillImageBounds.maxX - fillImageBounds.minX, fillImageBounds.maxY - fillImageBounds.minY, fillImageBounds.minX - pathBounds.minX, fillImageBounds.minY - pathBounds.minY);
	fillImageData.release();
	fillImageData = newFillImageData;
  }
  fillImageBounds = util.deepCopyTable(pathBounds);
  return fillImageData;
}

TYPE DrawDataFrame::getFillImage() {
  if (fillImage != null) {
	return fillImage;
  }
  if (fillImageData == null) {
	return null;
  }
  fillImage = love.graphics.newImage(fillImageData);
  fillImage.setFilter("nearest", "nearest");
  return fillImage;
}

TYPE DrawDataFrame::updateFillImageWithFillImageData() {
  if (fillImageData == null) {
	return;
  }
  if (fillImage != null) {
	if (fillImage.getWidth() == fillImageData.getWidth() && fillImage.getHeight() == fillImageData.getHeight()) {
	  fillImage.replacePixels(fillImageData);
	  return;
	}
	fillImage.release();
  }
  fillImage = love.graphics.newImage(fillImageData);
  fillImage.setFilter("nearest", "nearest");
}

TYPE DrawDataFrame::compressFillCanvas() {
  if (fillImageData == null) {
	return;
  }
  if (fillImageData.isEmpty()) {
	fillImageData.release();
	if (fillImage != null) {
	  fillImage.release();
	}
	fillImageData = null;
	fillImage = null;
  } else {
	auto [minX, minY, maxX, maxY] = fillImageData.getBounds();
	auto width = (maxX - minX) + 1;
	auto height = (maxY - minY) + 1;
	auto newFillImageData = love.image.newImageData(width, height);
	// sourceX, sourceY, sourceWidth, sourceHeight, destX, destY
	newFillImageData.copyImageData(fillImageData, minX, minY, width, height, 0, 0);
	if (DEBUG_FILL_IMAGE_SIZE) {
	  for (size_t x = 0; x < width - 1; x++) {
		newFillImageData.setPixel(x, 0, 1, 0, 0, 1);
	  }
	  for (size_t y = 0; y < height - 1; y++) {
		newFillImageData.setPixel(0, y, 1, 0, 0, 1);
	  }
	}
	fillImageData.release();
	fillImageData = newFillImageData;
	fillImageBounds.minX = fillImageBounds.minX + minX;
	fillImageBounds.minY = fillImageBounds.minY + minY;
	fillImageBounds.maxX = fillImageBounds.maxX + minX;
	fillImageBounds.maxY = fillImageBounds.maxY + minY;
  }
}

TYPE DrawDataFrame::floodFill(TYPE x, TYPE y) {
  updatePathsCanvas();
  auto pathsImageData = pathsCanvas.newImageData();
  auto pixelCount = getFillImageDataSizedToPathBounds().floodFill(floor((x * parent().fillPixelsPerUnit) - fillImageBounds.minX), floor((y * parent().fillPixelsPerUnit) - fillImageBounds.minY), pathsImageData, parent().color[1], parent().color[2], parent().color[3], 1);
  compressFillCanvas();
  updateFillImageWithFillImageData();
  return pixelCount > 0;
}

TYPE DrawDataFrame::floodClear(TYPE x, TYPE y, TYPE radius) {
  updatePathsCanvas();
  auto pathsImageData = pathsCanvas.newImageData();
  auto pixelCount = getFillImageDataSizedToPathBounds().floodFillErase(floor((x * parent().fillPixelsPerUnit) - fillImageBounds.minX), floor((y * parent().fillPixelsPerUnit) - fillImageBounds.minY), floor(radius * parent().fillPixelsPerUnit), pathsImageData);
  compressFillCanvas();
  updateFillImageWithFillImageData();
  return pixelCount > 0;
}

TYPE DrawDataFrame::resetFill() {
  cleanUpPaths();
  updatePathsCanvas();
  auto pathsImageData = pathsCanvas.newImageData();
  getFillImageDataSizedToPathBounds().updateFloodFillForNewPaths(pathsImageData);
  compressFillCanvas();
  updateFillImageWithFillImageData();
}

TYPE DrawDataFrame::function() {
  love.graphics.push("all");
  love.graphics.origin();
  love.graphics.translate(-bounds.minX, -bounds.minY);
  love.graphics.scale(parent().fillPixelsPerUnit);
  love.graphics.clear(0, 0, 0, 0);
  love.graphics.setColor(1, 1, 1, 1);
  graphics().draw();
  love.graphics.pop();
}

TYPE DrawDataFrame::updatePathsCanvas() {
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
  if (pathsCanvas == null || pathsCanvas.getWidth() != width || pathsCanvas.getHeight() != height) {
	if (pathsCanvas != null) {
	  pathsCanvas.release();
	}
	pathsCanvas = love.graphics.newCanvas(width, height, {
	  dpiscale = 1;
	  msaa = 4;
	});
  }
  pathsCanvas.renderTo(undefined);
}*/

ToveGraphicsHolder DrawDataFrame::graphics() {
  if (_graphicsNeedsReset || !_graphics) {
	_graphicsNeedsReset = false;
	cleanUpPaths();
	_graphics = ToveGraphicsHolder();
	for (size_t i = 1; i < pathDataList.size(); i++) {
	  _graphics->addPath(pathDataList[i].tovePath);
	}
  }
  return *_graphics;
}

void DrawDataFrame::renderFill() {
  /*auto fillImage = getFillImage();
  if (fillImage != null) {
	love.graphics.draw(fillImage, fillImageBounds.minX / parent().fillPixelsPerUnit, fillImageBounds.minY / parent().fillPixelsPerUnit, 0, 1 / parent().fillPixelsPerUnit, 1 / parent().fillPixelsPerUnit);
  }*/
}
/*
TYPE DrawDataFrame::function() {
  auto pathBounds = getPathDataBounds();
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
  love.graphics.translate((padding - pathBounds.minX) + widthPadding, (padding - pathBounds.minY) + heightPadding);
  love.graphics.clear(0, 0, 0, 0);
  love.graphics.setColor(1, 1, 1, 1);
  renderFill();
  graphics().draw();
  love.graphics.pop();
}

TYPE DrawDataFrame::renderPreviewPng(TYPE size) {
  if (isLinked) {
	return null;
  }
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
}*/



}
}
