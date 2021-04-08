#include "slowdown.h"

#include "behaviors/all.h"


//
// Enable, disable
//

void SlowdownBehavior::handleEnableComponent(ActorId actorId, SlowdownComponent &component) {
  if (auto body = getBehaviors().byType<BodyBehavior>().maybeGetPhysicsBody(actorId)) {
    // In Lua we had a physics scale of 0.5 applied through the Love API (see top of 'Common.lua').
    // Love scales max torque down twice, but I had to also do this for max force to make the
    // behavior actually match empirically...
    b2FrictionJointDef jointDef;
    jointDef.Initialize(getScene().getPhysicsBackgroundBody(), body, body->GetPosition());
    jointDef.maxForce = std::max(0.01f, 10 * 0.5f * 0.5f * component.props.motionSlowdown());
    jointDef.maxTorque = std::max(0.01f, 8 * 0.5f * 0.5f * component.props.rotationSlowdown());
    component.joint = (b2FrictionJoint *)getScene().getPhysicsWorld().CreateJoint(&jointDef);
  }
}

void SlowdownBehavior::handleDisableComponent(
    ActorId actorId, SlowdownComponent &component, bool removeActor) {
  if (!removeActor) {
    if (component.joint) {
      if (getBehaviors().byType<BodyBehavior>().maybeGetPhysicsBody(actorId)) {
        // Body destruction destroys attached joints, so make sure to have checked that
        getScene().getPhysicsWorld().DestroyJoint(component.joint);
      }
      component.joint = nullptr;
    }
  }
}
