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


  const b2Body *maybeGetPhysicsBody(ActorId actorId) const; // `nullptr` if not present


private:
  b2Body *maybeGetPhysicsBody(ActorId actorId); // `nullptr` if not present
};


// Inline implementations

inline b2Body *BodyBehavior::maybeGetPhysicsBody(ActorId actorId) {
  if (auto component = maybeGetComponent(actorId)) {
    return component->body;
  }
  return nullptr;
}

inline const b2Body *BodyBehavior::maybeGetPhysicsBody(ActorId actorId) const {
  if (auto component = maybeGetComponent(actorId)) {
    return component->body;
  }
  return nullptr;
}
