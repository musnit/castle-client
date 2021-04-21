#pragma once

#include "tests.h"

#ifdef CASTLE_ENABLE_TESTS

#include "precomp.h"

#include "behaviors/base.h"


struct TestComponent : BaseComponent {
  int i;
};

class TestBehavior : public BaseBehavior<TestBehavior, TestComponent> {
  // A simple behavior used in 'tests.cpp' to make sure basic behavior functionality works

public:
  static constexpr auto name = "Test";

  using BaseBehavior::BaseBehavior;

  void handleAddComponent(ActorId actorId, TestComponent &component) {
    component.i = nextI++;
    adds.emplace_back(actorId, component.i);
  }

  void handleDisableComponent(ActorId actorId, TestComponent &component, bool removeActor) {
    disables.emplace_back(actorId, component.i, removeActor);
  }

  int nextI = 0;
  std::vector<std::pair<ActorId, int>> adds;
  std::vector<std::tuple<ActorId, int, bool>> disables;

  friend struct BasicComponentManagementTest;
};

#endif
