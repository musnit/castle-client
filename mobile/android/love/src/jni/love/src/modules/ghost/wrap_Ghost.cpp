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
#include "DrawAlgorithms.hpp"
#include "DrawData.hpp"

#include <iostream>
#include <cmath>

namespace love {
namespace ghost {

#define instance() (Module::getInstance<Ghost>(Module::M_GHOST))

  static const luaL_Reg w_DrawData_functions[] = { { 0, 0 } };

  static int luaopen_drawdata(lua_State *L) {
    return luax_register_type(L, &DrawData::type, w_DrawData_functions, nullptr);
  }

  static const luaL_Reg functions[] = { { 0, 0 } };

  static const lua_CFunction types[] = { luaopen_drawdata, 0 };

  extern "C" int luaopen_love_ghost(lua_State *L) {
    Ghost *instance = instance();
    if (instance == nullptr) {
      luax_catchexcept(L, [&]() {
        instance = new Ghost();
      });
    } else
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
