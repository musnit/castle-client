#pragma once

#include "precomp.h"

#include "behaviors/base.h"


struct BodyComponent : BaseComponent {
  b2Body *body;
};

class BodyBehavior : public BaseBehavior<BodyBehavior, BodyComponent> {
public:
  static constexpr char name[] = "Body";

  using BaseBehavior::BaseBehavior;

  void handleAddComponent(ActorId actorId, BodyComponent &component);
  void handleDisableComponent(ActorId actorId, BodyComponent &component, bool removeActor);
};
