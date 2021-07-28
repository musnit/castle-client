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

  int w_loadDrawData(lua_State *L) {
    StrongRef<DrawData> i;
    DrawData *d = new DrawData(L, 1);

    i.set(d);

    luax_pushtype(L, i);

    return 1;
  }

  int w_loadDrawDataFromString(lua_State *L) {
    const char *json = luaL_checkstring(L, 1);

    StrongRef<DrawData> i;
    DrawData *d;

    Archive archive = Archive::fromJson(json);
    archive.read([&](Archive::Reader &r) {
      d = new DrawData(r);
    });

    i.set(d);
    luax_pushtype(L, i);

    // test writing
    Archive archive2;
    archive2.write([&](Archive::Writer &w) {
      d->write(w);
    });

    std::string output = archive2.toJson();

    return 1;
  }

  int w_DrawData_render(lua_State *L) {
    DrawData *d = luax_checktype<DrawData>(L, 1);
    d->render(std::nullopt);

    return 0;
  }

  static const luaL_Reg w_DrawData_functions[] = { { "render", w_DrawData_render }, { 0, 0 } };

  static int luaopen_drawdata(lua_State *L) {
    return luax_register_type(L, &DrawData::type, w_DrawData_functions, nullptr);
  }

  static const luaL_Reg functions[] = { { "loadDrawData", w_loadDrawData },
    { "loadDrawDataFromString", w_loadDrawDataFromString }, { 0, 0 } };

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
