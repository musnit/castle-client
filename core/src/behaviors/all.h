#pragma once

#include "precomp.h"

#include "scene.h"
#include "behaviors/body.h"
#include "behaviors/solid.h"
#include "behaviors/moving.h"
#include "behaviors/falling.h"
#include "behaviors/bouncy.h"
#include "behaviors/friction.h"
#include "behaviors/rotating_motion.h"
#include "behaviors/slowdown.h"
#include "behaviors/speed_limit.h"
#include "behaviors/test.h"
#include "behaviors/debug_draw.h"


class AllBehaviors {
  // Contains a single instance of each behavior. Provides utilities to get the behavior instance
  // for a type and to perform an action on each behavior.

public:
  AllBehaviors(const AllBehaviors &) = delete; // Prevent accidental copies
  const AllBehaviors &operator=(const AllBehaviors &) = delete;

  explicit AllBehaviors(Scene &scene)
      : AllBehaviors(scene, std::make_index_sequence<std::tuple_size_v<decltype(behaviors)>>()) {
  }


  // Behavior access

  template<typename Behavior>
  Behavior &byType();
  template<typename Behavior>
  const Behavior &byType() const;

  template<typename F>
  void byName(const char *name, F &&f); // If name is statically known, prefer `byType` above
  template<typename F>
  void byName(const char *name, F &&f) const;

  template<typename F>
  void forEachBehavior(F &&f);
  template<typename F>
  void forEachBehavior(F &&f) const;


private:
  /* clang-format off */
  std::tuple<
    BodyBehavior,
    SolidBehavior,
    MovingBehavior,
    FallingBehavior,
    BouncyBehavior,
    FrictionBehavior,
    RotatingMotionBehavior,
    SlowdownBehavior,
    SpeedLimitBehavior,
    DebugDrawBehavior
#ifdef CASTLE_ENABLE_TESTS
    , TestBehavior
#endif
    > behaviors;
  /* clang-format on */


  template<size_t... Is>
  AllBehaviors(Scene &scene, std::index_sequence<Is...>)
      : behaviors(std::tuple_element_t<Is, decltype(behaviors)> { scene }...) {
  }
};


// Inlined implementations

template<typename Behavior>
Behavior &AllBehaviors::byType() {
  return std::get<Behavior>(behaviors);
}

template<typename Behavior>
const Behavior &AllBehaviors::byType() const {
  return std::get<Behavior>(behaviors);
}

template<typename F>
void AllBehaviors::byName(const char *name, F &&f) {
  const auto nameHash = entt::hashed_string(name).value();
  forEachBehavior([&](auto &behavior) {
    constexpr auto behaviorName = std::remove_reference_t<decltype(behavior)>::name;
    constexpr auto behaviorNameHash = entt::hashed_string(behaviorName).value();
    if (nameHash == behaviorNameHash && !std::strcmp(name, behaviorName)) {
      f(behavior);
    }
  });
}

template<typename F>
void AllBehaviors::byName(const char *name, F &&f) const {
  const auto nameHash = entt::hashed_string(name).value();
  forEachBehavior([&](auto &behavior) {
    constexpr auto behaviorName = std::remove_reference_t<decltype(behavior)>::name;
    constexpr auto behaviorNameHash = entt::hashed_string(behaviorName).value();
    if (nameHash == behaviorNameHash && !std::strcmp(name, behaviorName)) {
      f(behavior);
    }
  });
}

template<typename F>
void AllBehaviors::forEachBehavior(F &&f) {
  std::apply(
      [&](auto &&...args) {
        (f(args), ...);
      },
      behaviors);
}

template<typename F>
void AllBehaviors::forEachBehavior(F &&f) const {
  std::apply(
      [&](auto &&...args) {
        (f(args), ...);
      },
      behaviors);
}
