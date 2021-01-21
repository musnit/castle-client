//
//  wrap_Ghost.cpp
//  liblove-ios
//
//  Created by Jesse Ruder on 1/20/21.
//

#include "wrap_Ghost.hpp"

#include "common/config.h"
#include "common/runtime.h"
#include "common/Module.h"

#include <iostream>
#include <cmath>

namespace love
{
namespace ghost
{

#define instance() (Module::getInstance<Ghost>(Module::M_GHOST))

int w_test(lua_State *L)
{
	return 0;
}

static const luaL_Reg functions[] =
{
	{ "test", w_test },
	/*{ "newImageData",  w_newImageData },
	{ "newCompressedData", w_newCompressedData },
	{ "isCompressed", w_isCompressed },
	{ "newCubeFaces", w_newCubeFaces },*/
	{ 0, 0 }
};

static const lua_CFunction types[] =
{
	/*luaopen_imagedata,
	luaopen_compressedimagedata,*/
	0
};

extern "C" int luaopen_love_ghost(lua_State *L)
{
	Ghost *instance = instance();
	if (instance == nullptr)
	{
		luax_catchexcept(L, [&](){ instance = new Ghost(); });
	}
	else
		instance->retain();

	WrappedModule w;
	w.module = instance;
	w.name = "ghost";
	w.type = &Module::type;
	w.functions = functions;
	w.types = types;

	int n = luax_register_module(L, w);

	return n;
}

}
}
