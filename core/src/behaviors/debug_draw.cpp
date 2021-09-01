#include "debug_draw.h"

#include "behaviors/all.h"


//
// Draw
//

void DebugDrawBehavior::handleDrawComponent(ActorId actorId, const DebugDrawComponent &component,
    std::optional<SceneDrawingOptions> options) const {
  if (auto body = getBehaviors().byType<BodyBehavior>().maybeGetPhysicsBody(actorId)) {
    lv.graphics.push();
    auto [x, y] = body->GetPosition();
    lv.graphics.translate(x, y);
    lv.graphics.rotate(body->GetAngle());
    lv.graphics.setColor(love::Colorf(0.1436, 0.6235, 0.8706, 1));

    for (auto fixture = body->GetFixtureList(); fixture; fixture = fixture->GetNext()) {
      auto shape = fixture->GetShape();
      switch (shape->GetType()) {
      case b2Shape::e_circle: {
        auto circle = dynamic_cast<const b2CircleShape *>(shape);
        lv.graphics.circle(
            love::Graphics::DRAW_FILL, circle->m_p.x, circle->m_p.y, circle->m_radius);
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
