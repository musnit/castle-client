#include "gesture.h"

#include "scene.h"


constexpr auto touchMoveFarThreshold = 35;


//
// Update
//

void Gesture::update() {
  // Clear old released touches
  registry.view<Touch>().each([&](TouchId touchId, Touch &touch) {
    if (touch.released) {
      registry.destroy(touchId);
    }
  });

  // Update active touches
  for (auto &loveTouch : lv.touch.getTouches()) {
    updateTouch(float(loveTouch.x), float(loveTouch.y), loveTouch.id, false);
  }
  if (lv.mouse.isDown({ 1 })) {
    double x = 0, y = 0;
    lv.mouse.getPosition(x, y);
    updateTouch(float(x), float(y), 0, true);
  }

  // Mark newly released touches
  registry.view<Touch>().each([&](Touch &touch) {
    if (touch.isMouse) {
      if (!lv.mouse.isDown({ 1 })) {
        touch.released = true;
      }
    } else {
      for (auto &loveTouch : lv.touch.getTouches()) {
        if (touch.loveTouchId == loveTouch.id) {
          return;
        }
      }
      touch.released = true;
    }
  });

  // Update counts and all-released state
  count = registry.size<Touch>();
  if (count > 0) {
    maxCount = std::max(maxCount, count);
    allReleased = true;
    registry.view<const Touch>().each([&](const Touch &touch) {
      allReleased = allReleased && touch.released;
    });
  } else {
    maxCount = 0;
    allReleased = false;
  }
}

void Gesture::updateTouch(float screenX, float screenY, love::int64 loveTouchId, bool isMouse) {
  auto screenPos = love::Vector2(screenX, screenY);
  auto pos = scene.inverseViewTransformPoint(screenPos);

  // Assuming a small number of simultaneous touches so this nested loop is fine
  auto found = false;
  registry.view<Touch>().each([&](Touch &touch) {
    if ((touch.isMouse && isMouse) || touch.loveTouchId == loveTouchId) {
      // Found existing touch, update it
      found = true;
      touch.pressed = false;
      touch.dx = pos.x - touch.x;
      touch.dy = pos.y - touch.y;
      touch.x = pos.x;
      touch.y = pos.y;
      touch.screenDX = screenPos.x - touch.screenX;
      touch.screenDY = screenPos.y - touch.screenY;
      touch.screenX = screenPos.x;
      touch.screenY = screenPos.y;
      if (!touch.movedFar) {
        auto totalDisp = love::Vector2(touch.screenX, touch.screenY)
            - love::Vector2(touch.initialScreenX, touch.initialScreenY);
        auto totalDispSqLen = totalDisp.getLengthSquare();
        if (totalDispSqLen > 0) {
          touch.movedNear = true;
        }
        if (totalDispSqLen > touchMoveFarThreshold * touchMoveFarThreshold) {
          touch.movedFar = true;
        }
      }
    }
  });
  if (!found) {
    // Didn't find an existing touch, it's a new one
    registry.emplace<Touch>(registry.create(),
        Touch(screenPos.x, screenPos.y, pos.x, pos.y, lv.timer.getTime(), loveTouchId, isMouse));
  }
}
