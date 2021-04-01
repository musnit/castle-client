#include "falling.h"

#include "behaviors/all.h"


//
// Enable, disable
//

void FallingBehavior::handleEnableComponent(ActorId actorId, FallingComponent &component) {
  if (auto body = getBehaviors().byType<BodyBehavior>().maybeGetPhysicsBody(actorId)) {
    body->SetGravityScale(component.props.gravity());
  }
}

void FallingBehavior::handleDisableComponent(
    ActorId actorId, FallingComponent &component, bool removeActor) {
  if (!removeActor) {
    if (auto body = getBehaviors().byType<BodyBehavior>().maybeGetPhysicsBody(actorId)) {
      body->SetGravityScale(0);
    }
  }
}
