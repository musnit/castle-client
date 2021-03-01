//
//  DrawDataFrame.hpp
//  liblove-ios
//
//  Created by Jesse Ruder on 1/29/21.
//

#ifndef DrawDataFrame_hpp
#define DrawDataFrame_hpp

#include <stdio.h>
#include "GhostTypes.hpp"

namespace love
{
namespace ghost
{

class DrawData;

class DrawDataFrame {
public:
	bool isLinked;
	PathDataList pathDataList;
	Bounds fillImageBounds;
	bool _graphicsNeedsReset = true;
	ToveGraphicsHolder* _graphics = NULL;
	DrawData *_parent;
	image::ImageData *fillImageData = NULL;
	graphics::Image *fillImage = NULL;
	graphics::Canvas *pathsCanvas = NULL;
	std::optional<std::string> fillPng;
	
	void read(lua_State *L, int index) {
		GHOST_READ_BOOL(isLinked, false)
		GHOST_READ_VECTOR(pathDataList, PathData)
		GHOST_READ_STRUCT(fillImageBounds)
		GHOST_READ_STRING(fillPng)
		
		deserializeFillAndPreview();
	}
	
	void deserializePathDataList();
	bool arePathDatasMergable(PathData pd1, PathData pd2);
	float round(float num, int numDecimalPlaces);
	std::vector<float> roundFloatArray(std::vector<float> a);
	void cleanUpPaths();
	Bounds getPathDataBounds(std::optional<Bounds> bounds);
	Bounds getPathDataBoundsInPixelCoordinates();
	void resetGraphics();
	ToveGraphicsHolder* graphics();
	void renderFill();
	
	graphics::Image* imageDataToImage(image::ImageData *);
	image::ImageData* getFillImageDataSizedToPathBounds();
	graphics::Image* getFillImage();
	void updateFillImageWithFillImageData();
	void compressFillCanvas();
	bool floodFill(float x, float y);
	bool floodClear(float x, float y, float radius);
	void resetFill();
	void updatePathsCanvas();
	void deserializeFillAndPreview();
	
	image::ImageData * canvasToImageData(graphics::Canvas * canvas);
	graphics::Canvas * newCanvas(int width, int height);
	void renderToCanvas(graphics::Canvas * canvas, const std::function<void()> & lambda);
	
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
	std::vector<DrawDataFrame *> frames;
	
	void read(lua_State *L, int index) {
		GHOST_READ_STRING(title)
		GHOST_READ_STRING(id)
		GHOST_READ_BOOL(isVisible, true)
		GHOST_READ_POINTER_VECTOR(frames, DrawDataFrame)
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
