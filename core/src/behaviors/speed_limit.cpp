#include "speed_limit.h"

#include "behaviors/all.h"


//
// Enable, disable
//

void SpeedLimitBehavior::handleDisableComponent(
    ActorId actorId, SpeedLimitComponent &component, bool removeActor) {
  if (!removeActor) {
    if (auto body = getBehaviors().byType<BodyBehavior>().maybeGetPhysicsBody(actorId)) {
      body->SetLinearDamping(0);
    }
  }
}


//
// Perform
//

void SpeedLimitBehavior::handlePerform(double dt) {
  forEachComponent([&](ActorId actorId, SpeedLimitComponent &component) {
    if (auto body = getBehaviors().byType<BodyBehavior>().maybeGetPhysicsBody(actorId)) {
      auto maximumSpeed = component.props.maximumSpeed();
      auto maximumSpeedSquared = maximumSpeed * maximumSpeed;
      auto speedSquared = body->GetLinearVelocity().LengthSquared();
      if (speedSquared > maximumSpeedSquared) {
        auto speed = sqrt(speedSquared);
        body->SetLinearDamping(float((speed / maximumSpeed - 1) / dt));
      } else {
        body->SetLinearDamping(0);
      }
    }
  });
}
