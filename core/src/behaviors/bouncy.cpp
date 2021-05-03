#include "bouncy.h"

#include "behaviors/all.h"


//
// Enable, disable
//

void BouncyBehavior::handleEnableComponent(ActorId actorId, BouncyComponent &component) {
  if (auto body = getBehaviors().byType<BodyBehavior>().maybeGetPhysicsBody(actorId)) {
    handleUpdateComponentFixtures(actorId, component, body);
  }
}

void BouncyBehavior::handleDisableComponent(
    ActorId actorId, BouncyComponent &component, bool removeActor) {
  if (!removeActor) {
    if (auto body = getBehaviors().byType<BodyBehavior>().maybeGetPhysicsBody(actorId)) {
      handleUpdateComponentFixtures(actorId, component, body);
    }
  }
}


//
// Getters, setters
//

void BouncyBehavior::handleSetProperty(
    ActorId actorId, BouncyComponent &component, PropId propId, const ExpressionValue &value) {
  auto body = getBehaviors().byType<BodyBehavior>().maybeGetPhysicsBody(actorId);
  if (!body) {
    return;
  }
  auto &props = component.props;
  if (propId == props.bounciness.id) {
    props.bounciness() = value.as<float>();
    handleUpdateComponentFixtures(actorId, component, body);
  } else {
    BaseBehavior::handleSetProperty(actorId, component, propId, value);
  }
}


//
// Fixtures
//

void BouncyBehavior::handleUpdateComponentFixtures(
    ActorId actorId, BouncyComponent &component, b2Body *body) {
  auto restitution = component.disabled ? 0 : component.props.bounciness();
  for (auto fixture = body->GetFixtureList(); fixture; fixture = fixture->GetNext()) {
    fixture->SetRestitution(restitution);
  }
}
