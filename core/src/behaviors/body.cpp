#include "body.h"


//
// Enable, disable
//

void BodyBehavior::handleEnableComponent(ActorId actorId, BodyComponent &component) {
  // Body
  b2BodyDef bodyDef;
  bodyDef.position = { component.props.x(), component.props.y() };
  bodyDef.angle = component.props.angle();
  bodyDef.type = component.props.bodyType() == "dynamic" ? b2_dynamicBody
      : component.props.bodyType() == "kinematic"        ? b2_kinematicBody
                                                         : b2_staticBody;
  component.body = getPhysicsWorld().CreateBody(&bodyDef);

  // Fixtures
  auto widthScale = component.props.widthScale(), heightScale = component.props.heightScale();
  for (auto &fixture : component.props.fixtures()) {
    if (fixture.shapeType() == "circle") {
      if (abs(abs(widthScale) - abs(heightScale)) < 0.002) {
        // Uniformly-scaled circle
        b2CircleShape shape;
        shape.m_p = { widthScale * fixture.x(), heightScale * fixture.y() };
        shape.m_radius = widthScale * fixture.radius();
        addFixture(component, &shape);
      } else {
        // Non-uniformly scaled circle -- approximate with a polygon
        auto x = fixture.x(), y = fixture.y();
        auto radius = fixture.radius();
        std::array<b2Vec2, 8> points;
        auto angle = 0.0f;
        for (auto i = 0; i < 8; ++i) {
          auto dX = radius * cos(angle), dY = radius * sin(angle);
          points[i] = { widthScale * (x + dX), heightScale * (y + dY) };
          angle -= 2 * M_PI / 8;
        }
        b2PolygonShape shape;
        shape.Set(points.data(), 8);
        addFixture(component, &shape);
      }
    } else if (fixture.shapeType() == "polygon") {
      // Polygon with given points
      auto pointsProps = fixture.points();
      std::array<b2Vec2, 8> points;
      auto nPoints = std::min(int(pointsProps.size() / 2), 8);
      for (auto i = 0; i < nPoints; ++i) {
        points[i].x = widthScale * pointsProps[2 * i];
        points[i].y = heightScale * pointsProps[2 * i + 1];
      }
      b2PolygonShape shape;
      shape.Set(points.data(), nPoints);
      addFixture(component, &shape);
    }
  }
}

void BodyBehavior::handleDisableComponent(
    ActorId actorId, BodyComponent &component, bool removeActor) {
  if (component.body) {
    getPhysicsWorld().DestroyBody(component.body);
  }
}


//
// Fixtures
//

b2Fixture *BodyBehavior::addFixture(BodyComponent &component, b2Shape *shape) {
  b2FixtureDef fixtureDef;
  // fixtureDef.isSensor = true; // TODO(nikki): Uncomment this after `Solid` is ready
  fixtureDef.friction = 0;
  fixtureDef.restitution = 0;
  fixtureDef.density = 1;
  fixtureDef.shape = shape;
  return component.body->CreateFixture(&fixtureDef);
}
