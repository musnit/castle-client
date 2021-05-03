#include "solid.h"

#include "behaviors/all.h"


//
// Enable, disable
//

void SolidBehavior::handleEnableComponent(ActorId actorId, SolidComponent &component) {
  if (auto body = getBehaviors().byType<BodyBehavior>().maybeGetPhysicsBody(actorId)) {
    handleUpdateComponentFixtures(actorId, component, body);
    wakeBodyAndColliders(body);
  }
}

void SolidBehavior::handleDisableComponent(
    ActorId actorId, SolidComponent &component, bool removeActor) {
  if (!removeActor) {
    if (auto body = getBehaviors().byType<BodyBehavior>().maybeGetPhysicsBody(actorId)) {
      handleUpdateComponentFixtures(actorId, component, body);
      wakeBodyAndColliders(body);
    }
  }
}

void SolidBehavior::wakeBodyAndColliders(b2Body *body) {
  // Wake body and colliders in case they need to move (eg. a body on top of us falling through)
  body->SetAwake(true);
  for (auto contactEdge = body->GetContactList(); contactEdge; contactEdge = contactEdge->next) {
    auto body1 = contactEdge->contact->GetFixtureA()->GetBody();
    auto body2 = contactEdge->contact->GetFixtureB()->GetBody();
    auto otherBody = body == body1 ? body2 : body1;
    otherBody->SetAwake(true);
  }
}


//
// Fixtures
//

void SolidBehavior::handleUpdateComponentFixtures(
    ActorId actorId, SolidComponent &component, b2Body *body) {
  for (auto fixture = body->GetFixtureList(); fixture; fixture = fixture->GetNext()) {
    fixture->SetSensor(component.disabled);
  }
}
