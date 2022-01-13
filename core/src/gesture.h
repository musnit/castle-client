#pragma once

#include "precomp.h"

#include "lv.h"


using TouchId = entt::entity; // Is unique throughout a `Scene`s lifetime, never recycled
constexpr TouchId nullTouch = entt::null; // A `TouchId`-compatible sentinel value

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
  love::Vector2 screenPos; // Screen-space position in device-independent pixels
  love::Vector2 initialScreenPos = screenPos;
  love::Vector2 screenDelta = { 0, 0 };
  love::Vector2 pos; // World-space position in world units
  love::Vector2 initialPos = pos;
  love::Vector2 delta = { 0, 0 };
  love::Vector2 cameraPos; // Camera-space position in world units
  love::Vector2 initialCameraPos = cameraPos;
  love::Vector2 cameraDelta = { 0, 0 };
  bool pressed = true; // Whether just pressed this frame
  bool released = false; // Whether just released this frame
  bool movedNear = false; // Whether this touch has moved at all
  bool movedFar = false; // Whether this touch has moved beyond a certain threshold
  double pressTime; // `lv.timer.getTime()` when pressed

  bool use(const TouchToken &token) const; // Mark for purpose if not already used, return if so
  void forceUse(const TouchToken &token) const; // Mark for purpose, unmark any old purpose
  bool isUsed() const; // Whether marked for any purpose
  bool isUsed(const TouchToken &token) const; // Whether marked for given purpose

private:
  friend class Gesture;

  love::int64 loveTouchId;
  bool isMouse;
  mutable int tokenId = 0;
  inline static uint64_t nextOrder = 0;
  uint64_t order = nextOrder++;

  Touch(TouchId id_, love::Vector2 screenPos_, love::Vector2 pos_, love::Vector2 cameraPos_,
      double pressTime_, love::int64 loveTouchId_,
      bool isMouse_); // Private so only `Gesture` can create
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

  explicit Gesture(Scene *scene_);


  // Queries

  int getCount() const; // Current number of simultaneous touches.
  int getMaxCount() const; // Maximum number of simultaneous touches at any point during whole
                           // gesture. Zero if no current gesture.
  bool isAllReleased() const; // Whether all touches are released (true for one frame at end of
                              // gesture). `false` if no current gesture.
  bool hasTouch(TouchId touchId) const;
  const Touch *maybeGetTouch(TouchId touchId) const; // Shortlived -- data may move on next frame
  template<typename F>
  void forEachTouch(F &&f) const; // `f` takes `(TouchId, const Touch &)` or `(const Touch &)`.
                                  // Iterates in earliest to latest order.
  template<typename F>
  void withSingleTouch(F &&f) const; // `forEachTouch(f)` if `getMaxCount() == 1`


  // Data -- extra data of any type that can be associated with a touch

  template<typename T, typename... Args>
  void setData(TouchId touchId, Args &&...args) const;
  template<typename T>
  bool hasData(TouchId touchId) const; // Shortlived -- may move when added to other touches
  template<typename T>
  T *maybeGetData(TouchId touchId) const; // Shortlived -- may move when added to other touches


  // Update

  void update();

  void setOffset(float x, float y);


private:
  Lv &lv { Lv::getInstance() };
  Scene *scene;

  entt::registry registry; // This is separate from the `Scene`'s actor registry. Each entity here
                           // represents a touch. This allows attaching extra data as components.
  entt::basic_view<entt::entity, entt::exclude_t<>, Touch> touchView = registry.view<Touch>();

  int count = 0;
  int maxCount = 0;
  bool allReleased = false;
  float offsetX = 0;
  float offsetY = 0;


  void updateTouch(float screenX, float screenY, love::int64 loveTouchId, bool isMouse);
};


// Inlined implementations

inline Touch::Touch(TouchId id_, love::Vector2 screenPos_, love::Vector2 pos_,
    love::Vector2 cameraPos_, double pressTime_, love::int64 loveTouchId_, bool isMouse_)
    : id(id_)
    , screenPos(screenPos_)
    , pos(pos_)
    , cameraPos(cameraPos_)
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

inline void Touch::forceUse(const TouchToken &token) const {
  tokenId = token.id;
}

inline bool Touch::isUsed() const {
  return tokenId != 0;
}

inline bool Touch::isUsed(const TouchToken &token) const {
  return tokenId == token.id;
}

inline Gesture::Gesture(Scene *scene_)
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

inline const Touch *Gesture::maybeGetTouch(TouchId touchId) const {
  return hasTouch(touchId) ? &std::get<0>(touchView.get(touchId)) : nullptr;
}

template<typename F>
inline void Gesture::forEachTouch(F &&f) const {
  touchView.each(std::forward<F>(f));
}

template<typename F>
inline void Gesture::withSingleTouch(F &&f) const {
  if (getMaxCount() == 1) {
    forEachTouch(std::forward<F>(f));
  }
}

template<typename T, typename... Args>
void Gesture::setData(TouchId touchId, Args &&...args) const {
  if (hasTouch(touchId)) {
    const_cast<entt::registry &>(registry).emplace_or_replace<T>(
        touchId, std::forward<Args>(args)...);
  }
}

template<typename T>
bool Gesture::hasData(TouchId touchId) const {
  return hasTouch(touchId) && registry.has<T>(touchId);
}

template<typename T>
T *Gesture::maybeGetData(TouchId touchId) const {
  return hasTouch(touchId) ? const_cast<entt::registry &>(registry).try_get<T>(touchId) : nullptr;
}

inline void Gesture::setOffset(float x, float y) {
  offsetX = x;
  offsetY = y;
}
