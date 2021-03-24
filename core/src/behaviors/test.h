#pragma once

#include "tests.h"

#ifdef CASTLE_ENABLE_TESTS

#include "precomp.h"

#include "behaviors/base.h"


struct TestComponent {
  int i;
};

class TestBehavior : public BaseBehavior<TestBehavior, TestComponent> {
  // A simple behavior used in 'tests.cpp' to make sure basic behavior functionality works

public:
  using BaseBehavior::BaseBehavior;

  void handleAddComponent(ActorId actorId, Component &component) {
    component.i = nextI++;
    adds.push_back({ actorId, component.i });
  }

  void handleDisableComponent(ActorId actorId, Component &component) {
    disables.push_back({ actorId, component.i });
  }

  int nextI = 0;
  std::vector<std::pair<ActorId, int>> adds;
  std::vector<std::pair<ActorId, int>> disables;
};

#endif
