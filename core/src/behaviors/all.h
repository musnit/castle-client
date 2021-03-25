#pragma once

#include "precomp.h"

#include "scene.h"
#include "behaviors/body.h"
#include "behaviors/test.h"


class AllBehaviors {
  // Contains a single instance of each behavior. Provides utilities to get the behavior instance
  // for a type and to perform an action on each behavior.

public:
  AllBehaviors(const AllBehaviors &) = delete; // Prevent accidental copies
  const AllBehaviors &operator=(const AllBehaviors &) = delete;

  AllBehaviors(Scene &scene)
      : AllBehaviors(scene, std::make_index_sequence<std::tuple_size_v<decltype(behaviors)>>()) {
  }


  // Behavior access

  template<typename Behavior>
  Behavior &get();
  template<typename Behavior>
  const Behavior &get() const;

  template<typename F>
  void forEachBehavior(F &&f);


private:
  /* clang-format off */
  std::tuple<
    BodyBehavior
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
Behavior &AllBehaviors::get() {
  return std::get<Behavior>(behaviors);
}

template<typename Behavior>
const Behavior &AllBehaviors::get() const {
  return std::get<Behavior>(behaviors);
}

template<typename F>
void AllBehaviors::forEachBehavior(F &&f) {
  std::apply(
      [&](auto &&... args) {
        (f(args), ...);
      },
      behaviors);
}
