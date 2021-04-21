//
//  Ghost.cpp
//  liblove-ios
//
//  Created by Jesse Ruder on 1/20/21.
//

#include "Ghost.hpp"

namespace love {
namespace ghost {

  love::Type Ghost::type("Ghost", &Object::type);

  const char *Ghost::getName() const {
    return "love.ghost";
  }


} // ghost
} // love
