#pragma once

#include "precomp.h"

#include "behaviors/base.h"
#include "lv.h"


struct DummyDrawingComponent : BaseComponent {};

class DummyDrawingBehavior : public BaseBehavior<DummyDrawingBehavior, DummyDrawingComponent> {
  // Just draws the collision shapes of the Body behavior on the actor. Useful for debugging
  // collision shapes and as a way to see actors for now until we get the real Drawing behavior to a
  // useable state.

public:
  static constexpr char name[] = "DummyDrawing";

  using BaseBehavior::BaseBehavior;

  void handleDrawComponent(ActorId actorId, const DummyDrawingComponent &component) const;

private:
  Lv &lv { Lv::getInstance() };
};
