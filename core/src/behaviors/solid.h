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
  static constexpr char name[] = "Solid";

  using BaseBehavior::BaseBehavior;


  void handleEnableComponent(ActorId actorId, SolidComponent &component);
  void handleDisableComponent(ActorId actorId, SolidComponent &component, bool removeActor);


private:
  void setEnabled(ActorId actorId, SolidComponent &component, bool enabled);
};
