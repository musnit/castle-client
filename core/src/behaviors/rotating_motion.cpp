#include "rotating_motion.h"

#include "behaviors/all.h"


//
// Enable, disable
//

void RotatingMotionBehavior::handleEnableComponent(
    ActorId actorId, RotatingMotionComponent &component) {
  if (auto body = getBehaviors().byType<BodyBehavior>().maybeGetPhysicsBody(actorId)) {
    body->SetType(b2_kinematicBody);
    body->SetLinearVelocity({ component.props.vx(), component.props.vy() });
    body->SetAngularVelocity(float(2 * M_PI * component.props.rotationsPerSecond()));
  }
}

void RotatingMotionBehavior::handleDisableComponent(
    ActorId actorId, RotatingMotionComponent &component, bool removeActor) {
  if (!removeActor) {
    if (auto body = getBehaviors().byType<BodyBehavior>().maybeGetPhysicsBody(actorId)) {
      body->SetType(b2_staticBody); // Internally sets velocities to zero
    }
  }
}
