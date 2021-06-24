#pragma once

#include "precomp.h"

#include "behaviors/base.h"
#include "props.h"


struct SolidComponent : BaseComponent {
  struct Props {
  } props;
};

class SolidBehavior : public BaseBehavior<SolidBehavior, SolidComponent> {
public:
  static constexpr auto name = "Solid";
  static constexpr auto behaviorId = 5;
  static constexpr auto displayName = "Solid";
  static constexpr auto allowsDisableWithoutRemoval = true;

  using BaseBehavior::BaseBehavior;


  void handleEnableComponent(ActorId actorId, SolidComponent &component);
  void handleDisableComponent(ActorId actorId, SolidComponent &component, bool removeActor);

  friend class BodyBehavior;
  void handleUpdateComponentFixtures(ActorId actorId, SolidComponent &component, b2Body *body);


private:
  void wakeBodyAndColliders(b2Body *body);
};
