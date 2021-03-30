#pragma once

#include "precomp.h"

#include "behaviors/base.h"
#include "lv.h"


struct DebugDrawComponent : BaseComponent {};

class DebugDrawBehavior : public BaseBehavior<DebugDrawBehavior, DebugDrawComponent> {
  // Just draws the collision shapes of the Body behavior on the actor. Useful for debugging
  // collision shapes and as a way to see actors for now until we get the real Drawing behavior to a
  // useable state.

public:
  static constexpr char name[] = "DebugDraw";

  using BaseBehavior::BaseBehavior;

  void handleDrawComponent(ActorId actorId, const DebugDrawComponent &component) const;

private:
  Lv &lv { Lv::getInstance() };
};