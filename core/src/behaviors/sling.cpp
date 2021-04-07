#include "sling.h"

#include "behaviors/all.h"


constexpr float maxDragLength = 3;


//
// Perform
//

void SlingBehavior::handlePerform(double dt) {
  if (!hasAnyEnabledComponent()) {
    return; // Skip gesture logic if no components
  }
  getGesture().withSingleTouch([&](const Touch &touch) {
    if (touch.released && touch.movedNear) {
      // Apply velocity on release
      auto drag = touch.initialPos - touch.pos;
      auto dragLen = drag.getLength();
      if (dragLen > maxDragLength) {
        // Clamp to max drag length
        drag *= maxDragLength / dragLen;
        dragLen = maxDragLength;
      }
      forEachEnabledComponent([&](ActorId actorId, SlingComponent &component) {
        if (auto body = getBehaviors().byType<BodyBehavior>().maybeGetPhysicsBody(actorId)) {
          auto vel = drag * component.props.speed();
          body->SetLinearVelocity({ vel.x, vel.y });
        }
      });
    }
  });
}


//
// Draw
//

void SlingBehavior::handleDrawOverlay() const {
  if (!hasAnyEnabledComponent()) {
    return; // Nothing to draw if no components
  }
  getGesture().withSingleTouch([&](const Touch &touch) {
    auto drag = touch.initialPos - touch.pos;
    auto dragLen = drag.getLength();
    if (dragLen > 0) {
      if (dragLen > maxDragLength) {
        // Clamp to max drag length
        drag *= maxDragLength / dragLen;
        dragLen = maxDragLength;
      }
      auto dragDir = drag / dragLen;

      lv.graphics.push();

      auto pixelScale = getScene().getPixelScale();
      lv.graphics.setLineWidth(1.25f * pixelScale);

      // Circle with solid outline and transparent fill
      auto circleRadius = 18 * pixelScale;
      lv.graphics.setColor({ 1, 1, 1, 0.8 });
      lv.graphics.circle(
          love::Graphics::DRAW_LINE, touch.initialPos.x, touch.initialPos.y, circleRadius);
      lv.graphics.setColor({ 1, 1, 1, 0.3 });
      lv.graphics.circle(
          love::Graphics::DRAW_FILL, touch.initialPos.x, touch.initialPos.y, circleRadius);

      // Line, triangle
      constexpr float lineLengthMultiplier = 0.8;
      auto triangleLength = 25 * pixelScale;
      auto triangleWidth = 10 * pixelScale;
      auto end = touch.initialPos + drag * lineLengthMultiplier;
      auto dirTL = dragDir * triangleLength;
      auto dirTW = dragDir * triangleWidth;
      lv.graphics.setColor({ 1, 1, 1, 0.8 });
      std::array line { touch.initialPos, end - dirTL };
      lv.graphics.polyline(line.data(), line.size());
      std::array triangle {
        end,
        love::Vector2(end.x - dirTL.x - dirTW.y, end.y - dirTL.y + dirTW.x),
        love::Vector2(end.x - dirTL.x + dirTW.y, end.y - dirTL.y - dirTW.x),
      };
      lv.graphics.polygon(love::Graphics::DRAW_FILL, triangle.data(), triangle.size(), false);

      lv.graphics.pop();
    }
  });
}
