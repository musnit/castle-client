#pragma once

#include "precomp.h"

#include "scene.h"
#include "behaviors/body.h"
#include "behaviors/test.h"


class AllBehaviors {
  // Contains a single instance of each behavior. Provides utilities to get the behavior instance
  // for a type and to perform an action on each behavior.

  template<size_t... Is>
  AllBehaviors(Scene &scene, std::index_sequence<Is...>)
      : behaviors(std::tuple_element_t<Is, decltype(behaviors)> { scene }...) {
  }

public:
  AllBehaviors(Scene &scene)
      : AllBehaviors(scene, std::make_index_sequence<std::tuple_size_v<decltype(behaviors)>>()) {
  }

  template<typename Behavior>
  Behavior &get() {
    return std::get<Behavior>(behaviors);
  }

  template<typename Behavior>
  const Behavior &get() const {
    return std::get<Behavior>(behaviors);
  }


private:
  /* clang-format off */
  std::tuple<
    BodyBehavior
#ifdef CASTLE_ENABLE_TESTS
    , TestBehavior
#endif
    > behaviors;
  /* clang-format on */
};
