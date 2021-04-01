#include "bouncy.h"

#include "behaviors/all.h"


//
// Enable, disable
//

void BouncyBehavior::handleEnableComponent(ActorId actorId, BouncyComponent &component) {
  if (auto body = getBehaviors().byType<BodyBehavior>().maybeGetPhysicsBody(actorId)) {
    for (auto fixture = body->GetFixtureList(); fixture; fixture = fixture->GetNext()) {
      fixture->SetRestitution(component.props.bounciness());
    }
  }
}

void BouncyBehavior::handleDisableComponent(
    ActorId actorId, BouncyComponent &component, bool removeActor) {
  if (!removeActor) {
    if (auto body = getBehaviors().byType<BodyBehavior>().maybeGetPhysicsBody(actorId)) {
      for (auto fixture = body->GetFixtureList(); fixture; fixture = fixture->GetNext()) {
        fixture->SetRestitution(0);
      }
    }
  }
}
