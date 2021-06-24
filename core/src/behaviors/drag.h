#pragma once

#include "precomp.h"

#include "behaviors/base.h"
#include "props.h"


struct DragComponent : BaseComponent {
  struct Props {
  } props;

  struct Handle {
    // One attachment of an actor to a touch. An actor can be attached to multiple touches.
    TouchId touchId {};
    b2MouseJoint *joint = nullptr; // Pulls toward the touch position
    b2Vec2 localPos; // Point on actor held onto in local space
  };
  SmallVector<Handle, 2> handles;
};

class DragBehavior : public BaseBehavior<DragBehavior, DragComponent> {
public:
  static constexpr auto name = "Drag";
  static constexpr auto behaviorId = 15;
  static constexpr auto displayName = "Drag";
  static constexpr auto allowsDisableWithoutRemoval = true;

  using BaseBehavior::BaseBehavior;


  void handleDisableComponent(ActorId actorId, DragComponent &component, bool removeActor);
  void handlePerform(double dt);

  void handleDrawOverlay() const;


private:
  Lv &lv { Lv::getInstance() };
};
