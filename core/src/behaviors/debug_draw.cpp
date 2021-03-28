#include "debug_draw.h"

#include "behaviors/all.h"


//
// Draw
//

void DebugDrawBehavior::handleDrawComponent(
    ActorId actorId, const DebugDrawComponent &component) const {
  if (auto body = getBehaviors().byType<BodyBehavior>().maybeGetPhysicsBody(actorId)) {
    lv.graphics.push();
    auto [x, y] = body->GetPosition();
    lv.graphics.translate(x, y);
    lv.graphics.rotate(body->GetAngle());
    lv.graphics.setColor(love::Colorf(0.4, 0.4, 0.2, 1));

    for (auto fixture = body->GetFixtureList(); fixture; fixture = fixture->GetNext()) {
      auto shape = fixture->GetShape();
      switch (shape->GetType()) {
      case b2Shape::e_circle: {
        auto circle = dynamic_cast<const b2CircleShape *>(shape);
        lv.graphics.circle(love::Graphics::DRAW_FILL, 0, 0, circle->m_radius);
      } break;
      case b2Shape::e_polygon: {
        auto poly = dynamic_cast<const b2PolygonShape *>(shape);
        lv.graphics.polygon(
            love::Graphics::DRAW_FILL, (love::Vector2 *)poly->m_vertices, poly->m_count, false);
      } break;
      default:
        break;
      }
    }

    lv.graphics.pop();
  }
}
