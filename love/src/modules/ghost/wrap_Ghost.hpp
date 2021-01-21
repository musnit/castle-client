//
//  wrap_Ghost.hpp
//  liblove-ios
//
//  Created by Jesse Ruder on 1/20/21.
//

#ifndef wrap_Ghost_hpp
#define wrap_Ghost_hpp

#include <stdio.h>
#include "common/runtime.h"
#include "Ghost.hpp"

namespace love
{
namespace ghost
{

extern "C" LOVE_EXPORT int luaopen_love_ghost(lua_State *L);

} // ghost
} // love

#endif /* wrap_Ghost_hpp */
