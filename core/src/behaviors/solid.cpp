#include "solid.h"

#include "behaviors/all.h"


//
// Enable, disable
//

void SolidBehavior::handleEnableComponent(ActorId actorId, SolidComponent &component) {
  setEnabled(actorId, component, true);
}

void SolidBehavior::handleDisableComponent(
    ActorId actorId, SolidComponent &component, bool removeActor) {
  setEnabled(actorId, component, false);
}

void SolidBehavior::setEnabled(ActorId actorId, SolidComponent &component, bool enabled) {
  if (auto body = getBehaviors().byType<BodyBehavior>().maybeGetPhysicsBody(actorId)) {
    for (auto fixture = body->GetFixtureList(); fixture; fixture = fixture->GetNext()) {
      fixture->SetSensor(!enabled); // Sensor is the opposite of solid
    }

    // Wake body and colliders in case they need to move (eg. a body on top of us falling through)
    body->SetAwake(true);
    for (auto contactEdge = body->GetContactList(); contactEdge; contactEdge = contactEdge->next) {
      auto body1 = contactEdge->contact->GetFixtureA()->GetBody();
      auto body2 = contactEdge->contact->GetFixtureB()->GetBody();
      auto otherBody = body == body1 ? body2 : body1;
      otherBody->SetAwake(true);
    }
  }
}
