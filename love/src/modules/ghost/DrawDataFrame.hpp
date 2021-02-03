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
	std::optional<ToveGraphicsHolder> _graphics;
	DrawData *_parent;
	
	void read(lua_State *L, int index) {
		GHOST_READ_BOOL(isLinked, false)
		GHOST_READ_VECTOR(pathDataList, PathData)
		GHOST_READ_STRUCT(fillImageBounds)
	}
	
	void deserializePathDataList();
	bool arePathDatasMergable(PathData pd1, PathData pd2);
	float round(float num, int numDecimalPlaces);
	std::vector<float> roundFloatArray(std::vector<float> a);
	void cleanUpPaths();
	Bounds getPathDataBounds(std::optional<Bounds> bounds);
	Bounds getPathDataBoundsInPixelCoordinates();
	void resetGraphics();
	ToveGraphicsHolder graphics();
	void renderFill();
	
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
	std::vector<DrawDataFrame> frames;
	
	void read(lua_State *L, int index) {
		GHOST_READ_STRING(title)
		GHOST_READ_STRING(id)
		GHOST_READ_BOOL(isVisible, true)
		GHOST_READ_VECTOR(frames, DrawDataFrame)
	}
	
	void setParent(DrawData *d) {
		_parent = d;
	}
};

}
}

#endif /* DrawDataFrame_hpp */
