#include "local_variables.h"

#include "behaviors/all.h"


//
// Read, write
//

void LocalVariablesBehavior::handleReadComponent(
    ActorId actorId, LocalVariablesComponent &component, Reader &reader) {
  Debug::log("added local variables to actor {}", actorId);
}

void LocalVariablesBehavior::handleWriteComponent(
    ActorId actorId, const LocalVariablesComponent &component, Writer &writer) const {
}
