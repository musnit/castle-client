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
  auto time = lv.timer.getTime();
  for (auto &loveTouch : lv.touch.getTouches()) {
    auto screenPos = love::Vector2(float(loveTouch.x), float(loveTouch.y));
    auto pos = scene.inverseViewTransformPoint(screenPos);

    // Assuming a small number of simultaneous touches so this nested loop is fine
    auto found = false;
    registry.view<Touch>().each([&](Touch &touch) {
      if (touch.loveTouchId == loveTouch.id) {
        // Found existing touch with this Love id, update it
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
      auto newTouchId = registry.create();
      registry.emplace<Touch>(
          newTouchId, Touch(screenPos.x, screenPos.y, pos.x, pos.y, time, loveTouch.id));
    }
  }

  // Mark newly released touches
  registry.view<Touch>().each([&](Touch &touch) {
    // If we don't find a corresponding Love touch, it's been released
    for (auto &loveTouch : lv.touch.getTouches()) {
      if (touch.loveTouchId == loveTouch.id) {
        return;
      }
    }
    touch.released = true;
  });

  // Update counts and all-released state
  {
    auto view = registry.view<const Touch>();
    count = view.size();
    if (count > 0) {
      maxCount = std::max(maxCount, count);
      allReleased = true;
      view.each([&](const Touch &touch) {
        allReleased = allReleased && touch.released;
      });
    } else {
      maxCount = 0;
      allReleased = false;
    }
  }
}
