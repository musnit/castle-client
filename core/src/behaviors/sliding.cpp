#include "sliding.h"

#include "behaviors/all.h"


//
// Enable, disable
//

void SlidingBehavior::handleEnableComponent(ActorId actorId, SlidingComponent &component) {
  auto &world = getScene().getPhysicsWorld();

  if (auto body = getBehaviors().byType<BodyBehavior>().maybeGetPhysicsBody(actorId)) {
    auto pos = body->GetPosition();
    b2BodyDef anchorBodyDef;
    anchorBodyDef.position = pos;
    component.anchorBody = world.CreateBody(&anchorBodyDef);

    auto &direction = component.props.direction();
    if (direction == "none") {
      // May still want rotation, so fix to a revolute joint
      b2RevoluteJointDef jointDef;
      jointDef.Initialize(component.anchorBody, body, pos);
      component.joint = world.CreateJoint(&jointDef);
    } else if (direction != "both") {
      // Constrain motion to one direction
      b2WheelJointDef jointDef;
      jointDef.Initialize(
          component.anchorBody, body, pos, direction == "horizontal" ? b2Vec2(1, 0) : b2Vec2(0, 1));
      component.joint = world.CreateJoint(&jointDef);
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
        // Body destruction destroys attached joints, so check make sure to have checked that
        getScene().getPhysicsWorld().DestroyJoint(component.joint);
      }
      body->SetFixedRotation(false);
    }
    component.joint = nullptr;
  }
}


//
// Getters, setters
//

void SlidingBehavior::handleSetProperty(
    ActorId actorId, SlidingComponent &component, PropId propId, const ExpressionValue &value) {
  auto body = getBehaviors().byType<BodyBehavior>().maybeGetPhysicsBody(actorId);
  if (!body) {
    return;
  }
  auto &props = component.props;
  if (propId == props.direction.id) { // NOLINT(bugprone-branch-clone)
    // TODO(nikki): Handle string values, then implement this
  } else if (propId == props.isRotationAllowed.id) {
    auto disallowRotation = value.as<int>() == 0;
    if (disallowRotation) {
      body->SetAngularVelocity(0);
    }
    body->SetFixedRotation(disallowRotation);
  } else {
    BaseBehavior::handleSetProperty(actorId, component, propId, value);
  }
}


//
// Position update
//

void SlidingBehavior::handleUpdateComponentPosition(
    ActorId actorId, SlidingComponent &component, b2Body *body) {
  auto pos = body->GetPosition();
  if (auto anchorBody = component.anchorBody) {
    anchorBody->SetTransform(pos, anchorBody->GetAngle());
  }
}
