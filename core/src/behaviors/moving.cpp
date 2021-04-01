#include "moving.h"

#include "behaviors/all.h"


//
// Enable, disable
//

void MovingBehavior::handleEnableComponent(ActorId actorId, MovingComponent &component) {
  if (auto body = getBehaviors().byType<BodyBehavior>().maybeGetPhysicsBody(actorId)) {
    body->SetLinearVelocity({ component.props.vx(), component.props.vy() });
    body->SetAngularVelocity(float(component.props.angularVelocity() * M_PI / 180));
    for (auto fixture = body->GetFixtureList(); fixture; fixture = fixture->GetNext()) {
      fixture->SetDensity(component.props.density());
    }
    body->SetType(b2_dynamicBody);
  }
}

void MovingBehavior::handleDisableComponent(
    ActorId actorId, MovingComponent &component, bool removeActor) {
  if (!removeActor) {
    if (auto body = getBehaviors().byType<BodyBehavior>().maybeGetPhysicsBody(actorId)) {
      body->SetLinearVelocity({ 0, 0 });
      body->SetAngularVelocity(0);
      for (auto fixture = body->GetFixtureList(); fixture; fixture = fixture->GetNext()) {
        fixture->SetDensity(1);
      }
      body->SetType(b2_staticBody);
    }
  }
}
