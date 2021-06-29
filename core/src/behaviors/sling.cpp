#include "sling.h"

#include "behaviors/all.h"


constexpr float maxDragLength = 3;

static const TouchToken slingTouchToken;


//
// Triggers
//

struct SlingTrigger : BaseTrigger {
  inline static const RuleRegistration<SlingTrigger, SlingBehavior> registration { "sling" };
  static constexpr auto description = "When this is slung";

  struct Params {
  } params;
};


//
// Perform
//

void SlingBehavior::handlePerform(double dt) {
  if (!hasAnyEnabledComponent()) {
    return; // Skip gesture logic if no components
  }
  getGesture().withSingleTouch([&](const Touch &touch) {
    if (!touch.use(slingTouchToken)) {
      return; // Touch was used for some other purpose
    }
    if (touch.released && touch.movedNear) {
      // Apply velocity on release
      auto drag = touch.initialCameraPos - touch.cameraPos;
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

      // Fire triggers
      auto &rulesBehavior = getBehaviors().byType<RulesBehavior>();
      rulesBehavior.fireAllEnabled<SlingTrigger, SlingComponent>({});
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
    if (!touch.isUsed(slingTouchToken)) {
      return; // Only draw touches we're using
    }
    auto drag = touch.initialCameraPos - touch.cameraPos;
    auto dragLen = drag.getLength();
    if (dragLen > 0) {
      if (dragLen > maxDragLength) {
        // Clamp to max drag length
        drag *= maxDragLength / dragLen;
        dragLen = maxDragLength;
      }
      auto dragDir = drag / dragLen;

      lv.graphics.push();
      auto cameraPos = getScene().getCameraPosition();
      lv.graphics.translate(cameraPos.x, cameraPos.y);

      auto pixelScale = getScene().getPixelScale();
      lv.graphics.setLineWidth(1.25f * pixelScale);

      // Circle with solid outline and transparent fill
      auto circleRadius = 18 * pixelScale;
      lv.graphics.setColor({ 1, 1, 1, 0.8 });
      lv.graphics.circle(love::Graphics::DRAW_LINE, touch.initialCameraPos.x,
          touch.initialCameraPos.y, circleRadius);
      lv.graphics.setColor({ 1, 1, 1, 0.3 });
      lv.graphics.circle(love::Graphics::DRAW_FILL, touch.initialCameraPos.x,
          touch.initialCameraPos.y, circleRadius);

      // Line, triangle
      constexpr float lineLengthMultiplier = 0.8;
      auto triangleLength = 25 * pixelScale;
      auto triangleWidth = 10 * pixelScale;
      auto end = touch.initialCameraPos + drag * lineLengthMultiplier;
      auto dirTL = dragDir * triangleLength;
      auto dirTW = dragDir * triangleWidth;
      lv.graphics.setColor({ 1, 1, 1, 0.8 });
      std::array line { touch.initialCameraPos, end - dirTL };
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
