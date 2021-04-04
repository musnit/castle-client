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

namespace love
{
namespace ghost
{

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

	Color color;
	Color lineColor;
	float gridSize;
	float scale;
	int version;
	float fillPixelsPerUnit;
	int numTotalLayers;
	std::vector<std::optional<Bounds>> framesBounds;
	DrawDataLayerId selectedLayerId;
	int selectedFrame;
	std::vector<std::unique_ptr<DrawDataLayer>> layers;
	bool _layerDataChanged;
	
	DrawData(lua_State *L, int index) {
		read(L, index);
		
		_layerDataChanged = true;
		
		/*ToveSubpathRef subpath = NewSubpath();
		TovePathRef path = NewPath(null);*/
	}
	
	DrawData(Archive2::Reader &archive) {
		read(archive);
		
		_layerDataChanged = true;
		
		/*ToveSubpathRef subpath = NewSubpath();
		TovePathRef path = NewPath(null);*/
	}
	
	/*template<typename A>
	void archive(A &obj) {
		obj.arr("color", color);
		obj.arr("lineColor", lineColor);
		obj.num("gridSize", )
	}*/

	void read(Archive2::Reader &archive) {
		archive.arr("color", color);
		archive.arr("lineColor", lineColor);
		gridSize = archive.num("gridSize", 0.71428571428571);
		scale = archive.num("scale", 10);
		version = archive.num("version", 3);
		fillPixelsPerUnit = archive.num("fillPixelsPerUnit", 25.6);
		numTotalLayers = archive.num("numTotalLayers", 1);
		archive.arr("framesBounds", [&]() {
			for (auto i = 0; i < archive.size(); i++) {
				Bounds bounds;
				archive.obj(i, bounds);
				framesBounds.push_back(bounds);
			}
		});
		// TODO: default this to first layer on the server
		selectedLayerId = archive.str("selectedLayerId", "");
		// TODO: subtract one on the server
		selectedFrame = archive.num("selectedFrame", 0);
		archive.arr("layers", [&]() {
			for (auto i = 0; i < archive.size(); i++) {
				auto layer = std::make_unique<DrawDataLayer>();
				archive.obj(i, *layer);
				layer->setParent(this);
				layers.push_back(std::move(layer));
			}
		});
	}

	void write(Archive2::Writer &archive) {
		archive.arr("color", color);
		archive.arr("lineColor", lineColor);
		archive.num("gridSize", gridSize);
		archive.num("scale", scale);
		archive.num("version", version);
		archive.num("fillPixelsPerUnit", fillPixelsPerUnit);
		archive.num("numTotalLayers", numTotalLayers);
		archive.arr("framesBounds", [&]() {
			for (size_t i = 0; i < framesBounds.size(); i++) {
				archive.obj(*framesBounds[i]);
			}
		});
		archive.str("selectedLayerId", selectedLayerId);
		archive.num("selectedFrame", selectedFrame);
		archive.arr("layers", [&]() {
			for (size_t i = 0; i < layers.size(); i++) {
				archive.obj(*layers[i]);
			}
		});
	}

	void read(lua_State *L, int index) {
		GHOST_READ_STRUCT(color)
		GHOST_READ_STRUCT(lineColor)
		GHOST_READ_NUMBER(gridSize, 0.71428571428571)
		GHOST_READ_NUMBER(scale, 10)
		GHOST_READ_INT(version, 3)
		GHOST_READ_NUMBER(fillPixelsPerUnit, 25.6)
		GHOST_READ_INT(numTotalLayers, 1)
		GHOST_READ_VECTOR(framesBounds, Bounds)
		GHOST_READ_STRING(selectedLayerId)
		GHOST_READ_INT(selectedFrame, 1)
		GHOST_READ_POINTER_VECTOR(layers, DrawDataLayer)
		
		for (size_t i = 0; i < layers.size(); i++) {
			layers[i]->setParent(this);
		}

		selectedFrame = selectedFrame - 1;
	}

	float gridCellSize();
	std::tuple<int, int> globalToGridCoordinates(float x, float y);
	std::tuple<int, int> gridToGlobalCoordinates(float x, float y);
	std::tuple<int, int> roundGlobalDiffCoordinatesToGrid(float x, float y);
	std::tuple<int, int> roundGlobalCoordinatesToGrid(float x, float y);
	std::tuple<int, int> clampGlobalCoordinates(float x, float y);
	float roundGlobalDistanceToGrid(float d);
	void makeSubpathsFromSubpathData(PathData *pathData);
	void addLineSubpathData(PathData *pathData, float p1x, float p1y, float p2x, float p2y);
	void addCircleSubpathData(PathData *pathData, float centerX, float centerY, float radius, float startAngle, float endAngle);
	void drawEndOfArc(PathData *pathData, float p1x, float p1y, float p2x, float p2y);
	void addSubpathDataForPoints(PathData *pathData, Point p1, Point p2);
	void updatePathDataRendering(PathData *pathData);
	DrawDataLayer* selectedLayer();
	int getRealFrameIndexForLayerId(DrawDataLayerId layerId, int frame);
	DrawDataLayer* layerForId(DrawDataLayerId id);
	DrawDataFrame* currentLayerFrame();
	PathDataList* currentPathDataList();
	void updateBounds();
	Bounds getBounds(int frame);
	bool arePathDatasFloodFillable(PathData pd1, PathData pd2);
	AnimationState newAnimationState();
	int getNumFrames();
	int modFrameIndex(int value);
	void runAnimation(AnimationState animationState, AnimationComponentProperties componentProperties, float dt, std::function<void(std::string)> fireTrigger, std::function<void()> fireChangedFrame);
	ToveGraphicsHolder* graphics();
	void preload();
	void render(std::optional<AnimationComponentProperties> componentProperties);
	bool isPointInBounds(Point point);
};

}
}


#endif /* DrawData_hpp */
