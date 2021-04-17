#include "gesture.h"

#include "scene.h"


constexpr float touchMoveFarThreshold = 35;


//
// Update
//

void Gesture::update() {
  // Clear old released touches
  touchView.each([&](TouchId touchId, Touch &touch) {
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
  touchView.each([&](Touch &touch) {
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
  count = touchView.size();
  if (count > 0) {
    maxCount = std::max(maxCount, count);
    allReleased = true;
    touchView.each([&](const Touch &touch) {
      allReleased = allReleased && touch.released;
    });
  } else {
    maxCount = 0;
    allReleased = false;
  }

  // Keep touches sorted by creation order
  registry.sort<Touch>(
      [&](const Touch &a, const Touch &b) {
        return a.order < b.order;
      },
      entt::insertion_sort());
}

void Gesture::updateTouch(float screenX, float screenY, love::int64 loveTouchId, bool isMouse) {
  auto screenPos = love::Vector2(screenX, screenY);
  auto pos = scene.inverseViewTransformPoint(screenPos);

  // Assuming a small number of simultaneous touches so this nested loop is fine
  auto found = false;
  touchView.each([&](Touch &touch) {
    if ((touch.isMouse && isMouse) || touch.loveTouchId == loveTouchId) {
      // Found existing touch, update it
      found = true;
      touch.pressed = false;
      touch.delta = pos - touch.pos;
      touch.pos = pos;
      touch.screenDelta = screenPos - touch.screenPos;
      touch.screenPos = screenPos;
      if (!touch.movedFar) {
        auto distSq = (touch.screenPos - touch.initialScreenPos).getLengthSquare();
        if (distSq > 0) {
          touch.movedNear = true;
        }
        if (distSq > touchMoveFarThreshold * touchMoveFarThreshold) {
          touch.movedFar = true;
        }
      }
    }
  });
  if (!found) {
    // Didn't find an existing touch, it's a new one
    auto newTouchId = registry.create();
    registry.emplace<Touch>(
        newTouchId, Touch(newTouchId, screenPos, pos, lv.timer.getTime(), loveTouchId, isMouse));
  }
}
