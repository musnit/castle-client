#include "slowdown.h"

#include "behaviors/all.h"


//
// Prop <-> physics value conversion utils
//

// In Lua we had a physics scale of 0.5 applied through the Love API (see top of 'Common.lua'). Love
// scales max torque down twice, but I had to also do this for max force to make the behavior
// actually match empirically...
static float maxForceForMotionSlowdown(float motionSlowdown) {
  return 0.5f * 0.5f * std::max(0.01f, 10 * motionSlowdown);
}
static float maxTorqueForRotationSlowdown(float rotationSlowdown) {
  return 0.5f * 0.5f * std::max(0.01f, 8 * rotationSlowdown);
}


//
// Enable, disable
//

void SlowdownBehavior::handleEnableComponent(ActorId actorId, SlowdownComponent &component) {
  if (auto body = getBehaviors().byType<BodyBehavior>().maybeGetPhysicsBody(actorId)) {
    b2FrictionJointDef jointDef;
    jointDef.Initialize(getScene().getPhysicsBackgroundBody(), body, body->GetPosition());
    jointDef.maxForce = maxForceForMotionSlowdown(component.props.motionSlowdown());
    jointDef.maxTorque = maxTorqueForRotationSlowdown(component.props.rotationSlowdown());
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


//
// Getters, setters
//

void SlowdownBehavior::handleSetProperty(
    ActorId actorId, SlowdownComponent &component, PropId propId, const ExpressionValue &value) {
  auto joint = component.joint;
  if (!joint) {
    return;
  }
  auto &props = component.props;
  if (propId == props.motionSlowdown.id) {
    auto motionSlowdown = value.as<float>();
    props.motionSlowdown() = motionSlowdown;
    joint->SetMaxForce(maxForceForMotionSlowdown(motionSlowdown));
  } else if (propId == props.rotationSlowdown.id) {
    auto rotationSlowdown = value.as<float>();
    props.rotationSlowdown() = rotationSlowdown;
    joint->SetMaxTorque(maxTorqueForRotationSlowdown(rotationSlowdown));
  } else {
    BaseBehavior::handleSetProperty(actorId, component, propId, value);
  }
}
