#include "friction.h"

#include "behaviors/all.h"


//
// Enable, disable
//

void FrictionBehavior::handleEnableComponent(ActorId actorId, FrictionComponent &component) {
  if (auto body = getBehaviors().byType<BodyBehavior>().maybeGetPhysicsBody(actorId)) {
    for (auto fixture = body->GetFixtureList(); fixture; fixture = fixture->GetNext()) {
      fixture->SetFriction(component.props.friction());
    }
  }
}

void FrictionBehavior::handleDisableComponent(
    ActorId actorId, FrictionComponent &component, bool removeActor) {
  if (!removeActor) {
    if (auto body = getBehaviors().byType<BodyBehavior>().maybeGetPhysicsBody(actorId)) {
      for (auto fixture = body->GetFixtureList(); fixture; fixture = fixture->GetNext()) {
        fixture->SetFriction(0);
      }
    }
  }
}
