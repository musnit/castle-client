#include "sliding.h"

#include "behaviors/all.h"


//
// Enable, disable
//

void SlidingBehavior::handleEnableComponent(ActorId actorId, SlidingComponent &component) {
  if (auto body = getBehaviors().byType<BodyBehavior>().maybeGetPhysicsBody(actorId)) {
    auto &direction = component.props.direction();
    if (direction == "none") {
      // May still want rotation, so fix to a revolute joint
      b2RevoluteJointDef jointDef;
      jointDef.Initialize(getScene().getPhysicsBackgroundBody(), body, body->GetPosition());
      component.joint = getScene().getPhysicsWorld().CreateJoint(&jointDef);
    } else if (direction != "both") {
      // Constrain motion to one direction
      b2WheelJointDef jointDef;
      jointDef.Initialize(getScene().getPhysicsBackgroundBody(), body, body->GetPosition(),
          direction == "horizontal" ? b2Vec2(1, 0) : b2Vec2(0, 1));
      component.joint = getScene().getPhysicsWorld().CreateJoint(&jointDef);
    }
    if (component.props.isRotationAllowed()) {
      body->SetFixedRotation(false);
    } else {
      body->SetAngularVelocity(0);
      body->SetFixedRotation(true);
    }
  }
}

void SlidingBehavior::handleDisableComponent(
    ActorId actorId, SlidingComponent &component, bool removeActor) {
  if (!removeActor) {
    if (auto body = getBehaviors().byType<BodyBehavior>().maybeGetPhysicsBody(actorId)) {
      if (component.joint) {
        getScene().getPhysicsWorld().DestroyJoint(component.joint);
        component.joint = nullptr;
      }
      body->SetFixedRotation(false);
    }
  }
}
