//
//  Ghost.hpp
//  liblove-ios
//
//  Created by Jesse Ruder on 1/20/21.
//

#ifndef Ghost_hpp
#define Ghost_hpp

#include <stdio.h>

#include "common/Module.h"

namespace love {
namespace ghost {

  class Ghost : public Module {
  public:
    static love::Type type;

    virtual ModuleType getModuleType() const {
      return M_GHOST;
    }

    /// @copydoc love::Module::getName
    const char *getName() const;
  };


} // ghost
} // love

#endif /* Ghost_hpp */
