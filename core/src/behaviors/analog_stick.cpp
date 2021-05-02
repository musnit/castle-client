#include "analog_stick.h"

#include "behaviors/all.h"


constexpr float maxDragLength = 2;

static const TouchToken analogStickTouchToken;


//
// Triggers
//

struct AnalogStickBeginsTrigger : BaseTrigger {
  inline static const RuleRegistration<AnalogStickBeginsTrigger, AnalogStickBehavior> registration {
    "analog stick begins"
  };

  struct Params {
  } params;
};

struct AnalogStickEndsTrigger : BaseTrigger {
  inline static const RuleRegistration<AnalogStickEndsTrigger, AnalogStickBehavior> registration {
    "analog stick ends"
  };

  struct Params {
  } params;
};


//
// Perform
//

void AnalogStickBehavior::handlePerform(double dt) {
  if (!hasAnyEnabledComponent()) {
    return; // Skip gesture logic if no components
  }

  // Find the analog stick touch, mark it as used, apply motion to actors. Not using
  // `.withSingleTouch` to allow other simultaneous touches (eg. button presses).
  auto found = false;
  getGesture().forEachTouch([&](const Touch &touch) {
    if (found) {
      return; // Already found an analog stick touch, don't consider multiple
    }
    if (!touch.movedNear) {
      return; // Need to move touch to initiate analog stick
    }
    auto newTouch = !touch.isUsed(analogStickTouchToken); // New touch if we haven't used it yet
    if (!touch.use(analogStickTouchToken)) {
      return; // Touch was used for some other purpose
    }
    found = true;

    // Initialize center
    if (newTouch) {
      center = touch.pos;
    }

    // Pull center toward touch (simplification of Lua `_updateCenter`)
    auto drag = touch.pos - center;
    center += drag * float(drag.getLength() > maxDragLength ? 0.06 : 0.02);

    // Recompute drag after pulling, clamp to max
    drag = touch.pos - center;
    auto dragLen = drag.getLength();
    if (dragLen > maxDragLength) {
      drag *= maxDragLength / dragLen;
      dragLen = maxDragLength;
    }

    // Move actors
    forEachEnabledComponent([&](ActorId actorId, AnalogStickComponent &component) {
      if (auto body = getBehaviors().byType<BodyBehavior>().maybeGetPhysicsBody(actorId)) {
        auto frameSpeed = component.props.speed() * dt;

        // Boost speed if actor is currently moving away from analog stick direction
        if (auto turnFriction = component.props.turnFriction(); turnFriction > 0) {
          auto currVel = body->GetLinearVelocity();
          auto currAngle = std::atan2(currVel.y, currVel.x);
          auto dragAngle = std::atan2(drag.y, drag.x);
          constexpr auto twoPi = 2 * M_PI;
          auto dAngle = currAngle - dragAngle + M_PI;
          dAngle = dAngle - std::floor(dAngle / twoPi) * twoPi - M_PI;
          frameSpeed *= 1 + turnFriction * std::abs(dAngle / M_PI);
        }

        // Apply impulse, constraining to desired axes
        auto impulse = drag * frameSpeed * body->GetMass();
        if (auto &axes = component.props.axes(); axes == "x") {
          impulse.y = 0;
        } else if (axes == "y") {
          impulse.x = 0;
        }
        body->ApplyLinearImpulseToCenter({ impulse.x, impulse.y }, true);
      }
    });

    // Fire triggers -- don't fire if began and ended in the same frame
    if (newTouch && !touch.released) {
      auto &rulesBehavior = getBehaviors().byType<RulesBehavior>();
      rulesBehavior.fireAllEnabled<AnalogStickBeginsTrigger, AnalogStickComponent>({});
    }
    if (!newTouch && touch.released) {
      auto &rulesBehavior = getBehaviors().byType<RulesBehavior>();
      rulesBehavior.fireAllEnabled<AnalogStickEndsTrigger, AnalogStickComponent>({});
    }
  });
}


//
// Draw
//

void AnalogStickBehavior::handleDrawOverlay() const {
  if (!hasAnyEnabledComponent()) {
    return; // Nothing to draw if no components
  }

  constexpr float maxDrawDragLength = 0.8 * maxDragLength;

  getGesture().forEachTouch([&](const Touch &touch) {
    if (!touch.isUsed(analogStickTouchToken)) {
      return; // Only draw touches we're using
    }
    auto clampedTouchPos = touch.pos;
    auto drag = clampedTouchPos - center;
    auto dragLen = drag.getLength();
    if (dragLen > 0) {
      if (dragLen > maxDrawDragLength) {
        // Clamp drag and touch to max draw drag length
        drag *= maxDrawDragLength / dragLen;
        dragLen = maxDrawDragLength;
        clampedTouchPos = center + drag;
      }

      lv.graphics.push();

      auto pixelScale = getScene().getPixelScale();
      lv.graphics.setLineWidth(1.25f * pixelScale);

      auto touchRadius = 38 * pixelScale;
      auto maxRadius = maxDrawDragLength + touchRadius;

      // Circle at center of analog stick
      lv.graphics.setColor({ 1, 1, 1, 0.8 });
      lv.graphics.circle(love::Graphics::DRAW_LINE, center.x, center.y, maxRadius);
      lv.graphics.setColor({ 1, 1, 1, 0.3 });
      lv.graphics.circle(love::Graphics::DRAW_FILL, center.x, center.y, maxRadius);

      // Circle at clamped touch
      lv.graphics.setColor({ 1, 1, 1, 0.4 });
      lv.graphics.circle(
          love::Graphics::DRAW_LINE, clampedTouchPos.x, clampedTouchPos.y, touchRadius);
      lv.graphics.setColor({ 1, 1, 1, 0.3 });
      lv.graphics.circle(
          love::Graphics::DRAW_FILL, clampedTouchPos.x, clampedTouchPos.y, touchRadius);

      lv.graphics.pop();
    }
  });
}
