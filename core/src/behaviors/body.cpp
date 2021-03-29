#include "body.h"


//
// Add, disable
//

void BodyBehavior::handleReadComponent(ActorId actorId, BodyComponent &component, Reader &reader) {
  // Log props
  fmt::print("read body:\n");
  Props::forEach(component.props, [&](auto &prop) {
    constexpr auto propName = std::remove_reference_t<decltype(prop)>::name();
    if constexpr (propName != "massData" && propName != "fixtures") {
      fmt::print("  prop {}: {}\n", prop.name(), prop.value);
    }
  });
  fmt::print("  massData: {}\n", component.props.massData());
  fmt::print("  fixtures:\n");
  for (auto &fixture : component.props.fixtures()) {
    if (fixture.shapeType() == "polygon") {
      fmt::print("    polygon: {}\n", fixture.points());
    } else {
      fmt::print(
          "    circle: x: {}, y: {}, radius: {}\n", fixture.x(), fixture.y(), fixture.radius());
    }
  }

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
  if (component.body) {
    getPhysicsWorld().DestroyBody(component.body);
  }
}
