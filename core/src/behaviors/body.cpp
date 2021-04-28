#include "body.h"


//
// Enable, disable
//

void BodyBehavior::handleEnableComponent(ActorId actorId, BodyComponent &component) {
  // Body
  b2BodyDef bodyDef;
  bodyDef.userData.pointer = entt::to_integral(actorId) + 1; // `actorId` can be 0, so offset
  bodyDef.type = b2_staticBody;
  bodyDef.position = { component.props.x(), component.props.y() };
  bodyDef.angle = component.props.angle();
  bodyDef.gravityScale = 0;
  component.body = getScene().getPhysicsWorld().CreateBody(&bodyDef);

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
    getScene().getPhysicsWorld().DestroyBody(component.body);
    component.body = nullptr;
  }
}


//
// Perform
//

void BodyBehavior::handlePerform(double dt) {
}


//
// Getters / setters
//

ExpressionValue BodyBehavior::handleGetProperty(
    ActorId actorId, const BodyComponent &component, PropId propId) const {
  auto body = component.body;
  if (!body) {
    return {};
  }
  auto &props = component.props;
  if (propId == props.x.id) {
    return body->GetPosition().x;
  } else if (propId == props.y.id) {
    return body->GetPosition().y;
  } else if (propId == props.angle.id) {
    return body->GetAngle() * 180 / M_PI;
  } else {
    return BaseBehavior::handleGetProperty(actorId, component, propId);
  }
}

void BodyBehavior::handleSetProperty(
    ActorId actorId, BodyComponent &component, PropId propId, const ExpressionValue &value) {
  auto body = component.body;
  if (!body) {
    return;
  }
  auto &props = component.props;
  if (propId == props.x.id) {
    body->SetTransform({ value.as<float>(), body->GetPosition().y }, body->GetAngle());
  } else if (propId == props.y.id) {
    body->SetTransform({ body->GetPosition().x, value.as<float>() }, body->GetAngle());
  } else if (propId == props.angle.id) {
    body->SetTransform(body->GetPosition(), float(value.as<double>() * M_PI / 180));
  } else {
    BaseBehavior::handleSetProperty(actorId, component, propId, value);
  }
}


//
// Fixtures
//

b2Fixture *BodyBehavior::addFixture(BodyComponent &component, b2Shape *shape) {
  // Defaults that other behaviors may override
  b2FixtureDef fixtureDef;
  fixtureDef.isSensor = true;
  fixtureDef.friction = 0;
  fixtureDef.restitutionThreshold = 0.1; // Keeps bounciness on at lower speeds
  fixtureDef.density = 1;
  fixtureDef.shape = shape;
  return component.body->CreateFixture(&fixtureDef);
}
