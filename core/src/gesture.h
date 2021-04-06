#pragma once

#include "precomp.h"

#include "lv.h"


using TouchId = entt::entity;

struct Touch {
  // Data about a single touch in a gesture

  Touch(const Touch &) = delete; // Prevent accidental copies
  const Touch &operator=(const Touch &) = delete;
  Touch(Touch &&) = default; // Allow moves
  Touch &operator=(Touch &&) = default;

  float screenX, screenY;
  float initialScreenX = screenX, initialScreenY = screenY;
  float screenDX = 0, screenDY = 0;
  float x, y;
  float initialX = x, initialY = y;
  float dx = 0, dy = 0;
  bool pressed = true; // Whether just pressed this frame
  bool released = false; // Whether just released this frame
  bool movedNear = false;
  bool movedFar = false;
  double pressTime; // `lv.timer.getTime()` when pressed

private:
  friend class Gesture;

  love::int64 loveTouchId;

  Touch(float screenX_, float screenY_, float x_, float y_, double pressTime_,
      love::int64 loveTouchId_); // Private so only `Gesture` can create
};

class Scene; // Forward declare because `Scene` contains us

class Gesture {
  // A set of simultaneous touch data (position, time) from first touch press to last touch release
  // is called a 'gesture'. This module provides methods for accessing information about the
  // currently active gesture.
  //
  // Each touch can also have additional data attached and queried of any type.

public:
  Gesture(const Gesture &) = delete; // Prevent accidental copies
  const Gesture &operator=(const Gesture &) = delete;
  Gesture(Gesture &&); // Allow move-construction

  explicit Gesture(Scene &scene_);


  // Queries

  int getCount() const; // Current number of simultaneous touches.
  int getMaxCount() const; // Maximum number of simultaneous touches at any point during whole
                           // gesture. Zero if no current gesture.
  bool isAllReleased() const; // Whether all touches are released (true for one frame at end of
                              // gesture). `false` if no current gesture.
  const Touch &getTouch(TouchId touchId) const;
  template<typename F>
  void forEachTouch(F &&f) const; // `F` must take `(TouchId, const Touch &)` or `(const Touch &)`


  // Update

  void update();


private:
  Lv &lv { Lv::getInstance() };
  Scene &scene;

  entt::registry registry; // This is separate from the `Scene`'s actor registry. Each entity here
                           // represents a touch. This allows attaching extra data as components.

  int count = 0;
  int maxCount = 0;
  bool allReleased = false;
};


// Inlined implementations

inline Gesture::Gesture(Scene &scene_)
    : scene(scene_) {
}

inline Touch::Touch(
    float screenX_, float screenY_, float x_, float y_, double pressTime_, love::int64 loveTouchId_)
    : screenX(screenX_)
    , screenY(screenY_)
    , x(x_)
    , y(y_)
    , pressTime(pressTime_)
    , loveTouchId(loveTouchId_) {
}

inline int Gesture::getCount() const {
  return count;
}

inline int Gesture::getMaxCount() const {
  return maxCount;
}

inline bool Gesture::isAllReleased() const {
  return allReleased;
}

inline const Touch &Gesture::getTouch(TouchId touchId) const {
  return registry.get<Touch>(touchId);
}

template<typename F>
inline void Gesture::forEachTouch(F &&f) const {
  registry.view<const Touch>().each(f);
}
