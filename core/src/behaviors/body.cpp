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
  // fmt::print("  massData: {}\n", component.props.massData());
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
  bodyDef.position = { component.props.x(), component.props.y() };
  bodyDef.angle = component.props.angle();
  bodyDef.bullet = component.props.bullet();
  bodyDef.type = component.props.bodyType() == "dynamic"
      ? b2_dynamicBody
      : component.props.bodyType() == "kinematic" ? b2_kinematicBody : b2_staticBody;
  component.body = getPhysicsWorld().CreateBody(&bodyDef);
  // auto &mdProps = component.props.massData();
  // b2MassData md { mdProps[2], { mdProps[0], mdProps[1] }, mdProps[3] };
  // component.body->SetMassData(&md);

  // Shape
  auto widthScale = component.props.widthScale(), heightScale = component.props.heightScale();
  for (auto &fixture : component.props.fixtures()) {
    b2FixtureDef fixtureDef;
    fixtureDef.density = 1;
    fixtureDef.friction = 0.3;
    if (fixture.shapeType() == "circle") {
      if (abs(abs(widthScale) - abs(heightScale)) < 0.002) {
        b2CircleShape shape;
        shape.m_p = { widthScale * fixture.x(), heightScale * fixture.y() };
        shape.m_radius = widthScale * fixture.radius();
        fixtureDef.shape = &shape;
        component.body->CreateFixture(&fixtureDef);
      } else {
        // TODO(nikki): Non-uniformly scaled circle shape
      }
    } else if (fixture.shapeType() == "polygon") {
      auto pointsProps = fixture.points();
      b2PolygonShape shape;
      std::array<b2Vec2, 8> points;
      for (auto i = 0; i < int(pointsProps.size()); i += 2) {
        points[i / 2].x = widthScale * pointsProps[i];
        points[i / 2].y = heightScale * pointsProps[i + 1];
      }
      shape.Set(points.data(), pointsProps.size() / 2);
      fixtureDef.shape = &shape;
      component.body->CreateFixture(&fixtureDef);
    }
    // NOTE: `fixtureDef.shape` points to lost memory at this point, don't use it!
  }
  // NOTE: Need to call `handleUpdateComponentFixture` and then reset mass data

  // Set mass data after creating fixtures
}

void BodyBehavior::handleDisableComponent(
    ActorId actorId, BodyComponent &component, bool removeActor) {
  if (component.body) {
    getPhysicsWorld().DestroyBody(component.body);
  }
}
