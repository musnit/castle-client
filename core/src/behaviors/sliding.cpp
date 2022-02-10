#include "sliding.h"

#include "behaviors/all.h"

void SlidingBehavior::cleanUpJoint(SlidingComponent &component) {
  auto &world = getScene().getPhysicsWorld();
  if (component.anchorBody) {
    world.DestroyBody(component.anchorBody);
    component.anchorBody = nullptr;

    // Body destruction destroys attached joints
    component.joint = nullptr;
  } else if (component.joint) {
    world.DestroyJoint(component.joint);
    component.joint = nullptr;
  }
}

void SlidingBehavior::updateJoint(ActorId actorId, SlidingComponent &component) {
  cleanUpJoint(component);
  if (auto body = getBehaviors().byType<BodyBehavior>().maybeGetPhysicsBody(actorId)) {
    auto &world = getScene().getPhysicsWorld();
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
  }
}

//
// Enable, disable
//

void SlidingBehavior::handleEnableComponent(ActorId actorId, SlidingComponent &component) {
  updateJoint(actorId, component);
  if (auto body = getBehaviors().byType<BodyBehavior>().maybeGetPhysicsBody(actorId)) {
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
    cleanUpJoint(component);
    if (auto body = getBehaviors().byType<BodyBehavior>().maybeGetPhysicsBody(actorId)) {
      body->SetFixedRotation(false);
    }
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
  if (propId == props.direction.id) {
    const char *cStrValue = value.as<const char *>();
    if (cStrValue && component.props.direction() != cStrValue) {
      component.props.direction() = cStrValue;
      if (!component.disabled) {
        updateJoint(actorId, component);
      }
    }
  } else if (propId == props.isRotationAllowed.id) {
    auto disallowRotation = value.as<int>() == 0;
    component.props.isRotationAllowed() = !disallowRotation;
    if (!component.disabled) {
      if (disallowRotation) {
        body->SetAngularVelocity(0);
      }
      body->SetFixedRotation(disallowRotation);
    }
  } else {
    BaseBehavior::handleSetProperty(actorId, component, propId, value);
  }
}


//
// Position update
//

void SlidingBehavior::handleUpdateComponentPosition(
    ActorId actorId, SlidingComponent &component, b2Body *body) {
  if (auto anchorBody = component.anchorBody) {
    anchorBody->SetTransform(body->GetPosition(), anchorBody->GetAngle());
  }
}
