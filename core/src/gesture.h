#pragma once

#include "precomp.h"

#include "lv.h"


using TouchId = entt::entity; // Is unique throughout a `Scene`s lifetime, never recycled

struct TouchToken {
  // A token to identify the purpose of a touch. Helps prevent overloading a single touch for
  // different uses.

private:
  friend struct Touch;

  inline static auto nextId = 1; // `0` marks no use
  int id = nextId++;
};

struct Touch {
  // Data about a single touch in a gesture. Includes flags for whether the touch was just pressed
  // or just released this frame, allowing processing gestures using per-frame polling rather than
  // event subscription.

  Touch(const Touch &) = delete; // Prevent accidental copies
  const Touch &operator=(const Touch &) = delete;
  Touch(Touch &&) = default; // Allow moves
  Touch &operator=(Touch &&) = default;

  TouchId id;
  love::Vector2 screenPos;
  love::Vector2 initialScreenPos { screenPos.x, screenPos.y };
  love::Vector2 screenDelta { 0, 0 };
  love::Vector2 pos;
  love::Vector2 initialPos { pos.x, pos.y };
  love::Vector2 delta { 0, 0 };
  bool pressed = true; // Whether just pressed this frame
  bool released = false; // Whether just released this frame
  bool movedNear = false; // Whether this touch has moved at all
  bool movedFar = false; // Whether this touch has moved beyond a certain threshold
  double pressTime; // `lv.timer.getTime()` when pressed

  bool use(const TouchToken &token) const; // Mark for this purpose, return whether successful
  bool isUsed() const; // Whether marked for any purpose
  bool isUsed(const TouchToken &token) const; // Whether marked for a given purpose

private:
  friend class Gesture;

  love::int64 loveTouchId;
  bool isMouse;
  mutable int tokenId = 0;
  inline static uint64_t nextOrder = 0;
  uint64_t order = nextOrder++;

  Touch(TouchId id_, const love::Vector2 &screenPos_, const love::Vector2 &pos_, double pressTime_,
      love::int64 loveTouchId_, bool isMouse_); // Private so only `Gesture` can create
};

class Scene; // Forward declare because `Scene` contains us

class Gesture {
  // A set of simultaneous touches from first touch press to last touch release is called a
  // 'gesture'. Provides methods for accessing each active touch in the current gesture, along with
  // information about the gesture as a whole.
  //
  // Each touch can also have additional data attached and queried of any type.

public:
  Gesture(const Gesture &) = delete; // Prevent accidental copies
  const Gesture &operator=(const Gesture &) = delete;
  Gesture(Gesture &&) = default; // Allow move-construction

  explicit Gesture(Scene &scene_);


  // Queries

  int getCount() const; // Current number of simultaneous touches.
  int getMaxCount() const; // Maximum number of simultaneous touches at any point during whole
                           // gesture. Zero if no current gesture.
  bool isAllReleased() const; // Whether all touches are released (true for one frame at end of
                              // gesture). `false` if no current gesture.
  bool hasTouch(TouchId touchId) const;
  const Touch &getTouch(TouchId touchId) const;
  const Touch *maybeGetTouch(TouchId touchId) const;
  template<typename F>
  void forEachTouch(F &&f) const; // `f` takes `(TouchId, const Touch &)` or `(const Touch &)`.
                                  // Iterates in earliest to latest order.
  template<typename F>
  void withSingleTouch(F &&f) const; // `forEachTouch(f)` if `getMaxCount() == 1`


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


  void updateTouch(float screenX, float screenY, love::int64 loveTouchId, bool isMouse);
};


// Inlined implementations

inline Touch::Touch(TouchId id_, const love::Vector2 &screenPos_, const love::Vector2 &pos_,
    double pressTime_, love::int64 loveTouchId_, bool isMouse_)
    : id(id_)
    , screenPos(screenPos_)
    , pos(pos_)
    , pressTime(pressTime_)
    , loveTouchId(loveTouchId_)
    , isMouse(isMouse_) {
}

inline bool Touch::use(const TouchToken &token) const {
  if (tokenId == 0) {
    tokenId = token.id;
    return true;
  }
  return tokenId == token.id;
}

inline bool Touch::isUsed() const {
  return tokenId != 0;
}

inline bool Touch::isUsed(const TouchToken &token) const {
  return tokenId == token.id;
}

inline Gesture::Gesture(Scene &scene_)
    : scene(scene_) {
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

inline bool Gesture::hasTouch(TouchId touchId) const {
  return registry.valid(touchId);
}

inline const Touch &Gesture::getTouch(TouchId touchId) const {
  return registry.get<Touch>(touchId);
}

inline const Touch *Gesture::maybeGetTouch(TouchId touchId) const {
  return hasTouch(touchId) ? &getTouch(touchId) : nullptr;
}

template<typename F>
inline void Gesture::forEachTouch(F &&f) const {
  registry.view<const Touch>().each(std::forward<F>(f));
}

template<typename F>
inline void Gesture::withSingleTouch(F &&f) const {
  if (getMaxCount() == 1) {
    forEachTouch(std::forward<F>(f));
  }
}
