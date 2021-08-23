#include "gesture_pan_zoom.h"

bool GesturePanZoom::isActive() {
  return hasGesture;
}

void GesturePanZoom::update(const Gesture &gesture, love::Transform &currentViewTransform) {
  auto gestureStarted = false;
  if (!hasGesture) {
    hasGesture = true;
    gestureStarted = true;
    gesture.forEachTouch([&](TouchId touchId, const Touch &touch) {
      if (touch1Id == entt::null) {
        touch1Id = touchId;
      } else if (touch2Id == entt::null) {
        touch2Id = touchId;
      }
    });
  }

  const Touch *touch1 = gesture.maybeGetTouch(touch1Id);
  const Touch *touch2 = gesture.maybeGetTouch(touch2Id);
  if (!touch1 || !touch2) {
    // these touches don't represent a valid pan-zoom gesture
    clear();
  } else {
    auto screenCenter = (touch1->screenPos + touch2->screenPos) * 0.5;
    center = currentViewTransform.inverseTransformPoint(screenCenter);

    auto screenPinchLength = (touch1->screenPos - touch2->screenPos).getLength();

    auto prevTouch1ScreenPos = touch1->screenPos - touch1->screenDelta;
    auto prevTouch2ScreenPos = touch2->screenPos - touch2->screenDelta;
    auto prevScreenCenter = (prevTouch1ScreenPos + prevTouch2ScreenPos) * 0.5;
    auto viewScale = currentViewTransform.getMatrix().getElements()[0]; // Assuming no rotation
    translate = (screenCenter - prevScreenCenter) / viewScale;

    float prevScreenPinchLength = 0;
    if (gestureStarted) {
      auto initialScreenPinchLength
          = (touch1->initialScreenPos - touch2->initialScreenPos).getLength();
      prevScreenPinchLength = initialScreenPinchLength;
    } else {
      prevScreenPinchLength = (prevTouch1ScreenPos - prevTouch2ScreenPos).getLength();
    }

    scale = prevScreenPinchLength / screenPinchLength;
  }
}

std::pair<love::Vector2, float> GesturePanZoom::apply(
    love::Vector2 &currentViewPosition, float currentViewWidth) {
  auto clampedTranslate = translate;
  float finalViewWidth = currentViewWidth;
  if (scale != 0) {
    finalViewWidth = fmax(clampViewWidth.x, fmin(clampViewWidth.y, scale * currentViewWidth));
    auto clampedScale = finalViewWidth / currentViewWidth;
    clampedTranslate = translate - (center - currentViewPosition) * (1.0f - clampedScale);
  }
  auto finalPosition = currentViewPosition - clampedTranslate;
  if (finalPosition.x < clampViewX.x) {
    finalPosition.x = clampViewX.x;
  }
  if (finalPosition.x > clampViewX.y) {
    finalPosition.x = clampViewX.y;
  }
  if (finalPosition.y < clampViewY.x) {
    finalPosition.y = clampViewY.x;
  }
  if (finalPosition.y > clampViewY.y) {
    finalPosition.y = clampViewY.y;
  }
  return std::pair<love::Vector2, float>(finalPosition, finalViewWidth);
}

void GesturePanZoom::clear() {
  hasGesture = false;
  touch1Id = entt::null;
  touch2Id = entt::null;
  scale = 1;
  center.x = 0;
  center.y = 0;
  translate.x = 0;
  translate.y = 0;
}
