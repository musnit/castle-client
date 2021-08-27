#pragma once

#include "precomp.h"
#include "gesture.h"

class GesturePanZoom {
public:
  GesturePanZoom(float minWidth, float maxWidth, love::Vector2 viewMin, love::Vector2 viewMax);

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
  bool hasGesture = false;
  TouchId touch1Id = entt::null, touch2Id = entt::null;

  // current gesture state
  love::Vector2 center;
  love::Vector2 translate;
  float scale = 1;

  // constraints
  float minWidth, maxWidth;
  love::Vector2 viewMin;
  love::Vector2 viewMax;
};

inline GesturePanZoom::GesturePanZoom(
    float minWidth_, float maxWidth_, love::Vector2 viewMin_, love::Vector2 viewMax_)
    : minWidth(minWidth_)
    , maxWidth(maxWidth_)
    , viewMin(viewMin_)
    , viewMax(viewMax_) {
}
