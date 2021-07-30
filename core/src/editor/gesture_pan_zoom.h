#pragma once

#include "precomp.h"
#include "gesture.h"

class GesturePanZoom {
public:
  GesturePanZoom() = default;

  bool isActive();
  void update(const Gesture &gesture, love::Transform &currentViewTransform);

  // set min/max pairs for view width, view x, view y; only affects apply()
  void setConstraints(
      love::Vector2 &clampViewWidth, love::Vector2 &clampViewX, love::Vector2 &clampViewY);

  // apply the current gesture state to a view
  // return: a pair with: new position, new view width
  std::pair<love::Vector2, float> apply(love::Vector2 &currentViewPosition, float currentViewWidth);

  void clear();

private:
  bool hasGesture;
  TouchId touch1Id = entt::null, touch2Id = entt::null;

  // current gesture state
  love::Vector2 center;
  love::Vector2 translate;
  float scale;

  // constraints - min/max
  love::Vector2 clampViewWidth;
  love::Vector2 clampViewX;
  love::Vector2 clampViewY;
};

inline void GesturePanZoom::setConstraints(
    love::Vector2 &clampViewWidth_, love::Vector2 &clampViewX_, love::Vector2 &clampViewY_) {
  clampViewWidth = clampViewWidth_;
  clampViewX = clampViewX_;
  clampViewY = clampViewY_;
}
