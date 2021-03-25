#include "body.h"


//
// Add, disable
//

void BodyBehavior::handleAddComponent(ActorId actorId, BodyComponent &component) {
  // Body
  b2BodyDef bodyDef;
  bodyDef.type = b2_dynamicBody;
  bodyDef.position = b2Vec2(0, 0);
  component.body = getPhysicsWorld().CreateBody(&bodyDef);

  // Shape
  b2PolygonShape shape;
  shape.SetAsBox(0.25, 0.25);
  b2FixtureDef fixtureDef;
  fixtureDef.shape = &shape;
  fixtureDef.density = 1;
  fixtureDef.friction = 0.3;
  component.body->CreateFixture(&fixtureDef);
}

void BodyBehavior::handleDisableComponent(
    ActorId actorId, BodyComponent &component, bool removeActor) {
  getPhysicsWorld().DestroyBody(component.body);
}
