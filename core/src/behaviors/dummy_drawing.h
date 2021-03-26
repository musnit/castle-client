#pragma once

#include "precomp.h"

#include "behaviors/base.h"
#include "lv.h"


struct DummyDrawingComponent : BaseComponent {};

class DummyDrawingBehavior : public BaseBehavior<DummyDrawingBehavior, DummyDrawingComponent> {
public:
  static constexpr char name[] = "DummyDrawing";

  using BaseBehavior::BaseBehavior;

  void handleDrawComponent(ActorId actorId, const DummyDrawingComponent &component) const;

private:
  Lv &lv { Lv::getInstance() };
};
