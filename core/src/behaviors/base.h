#pragma once

#include "precomp.h"

#include "scene.h"


template<typename Derived, typename Component_>
class BaseBehavior {
  // The base class for all behavior classes. Provides a bunch of utility methods that all behaviors
  // will probably want.

public:
  using Component = Component_;

  BaseBehavior(const BaseBehavior &) = delete; // Prevent accidental copies
  const BaseBehavior &operator=(const BaseBehavior &) = delete;
  BaseBehavior(BaseBehavior &&) = default; // Allow moves
  BaseBehavior &operator=(BaseBehavior &&) = default;

  BaseBehavior(Scene &scene_)
      : scene(scene_) {
  }


  // Component management

  Component &addComponent(ActorId actorId);
  void removeComponent(ActorId actorId);

  bool hasComponent(ActorId actorId) const;
  Component &getComponent(ActorId actorId);
  const Component &getComponent(ActorId actorId) const;


  // Handlers

  void handleAddComponent(ActorId, Component &) {
  }
  void handleDisableComponent(ActorId, Component &) {
  }


protected: // Protected so child classes can refer to these
  Scene &scene;
};


// Inlined implementations

template<typename Derived, typename Component>
Component &BaseBehavior<Derived, Component>::addComponent(ActorId actorId) {
  if (hasComponent(actorId)) {
    fmt::print("addComponent: actor already has a component for this behavior");
  }
  auto &component = scene.getEntityRegistry().emplace<Component>(actorId);
  static_cast<Derived &>(*this).handleAddComponent(actorId, component);
  return component;
}

template<typename Derived, typename Component>
void BaseBehavior<Derived, Component>::removeComponent(ActorId actorId) {
  if (!hasComponent(actorId)) {
    fmt::print("removeComponent: actor doesn't have a component for this behavior");
    return;
  }
  static_cast<Derived &>(*this).handleDisableComponent(actorId, getComponent(actorId));
  scene.getEntityRegistry().remove<Component>(actorId);
}

template<typename Derived, typename Component>
bool BaseBehavior<Derived, Component>::hasComponent(ActorId actorId) const {
  return scene.hasActor(actorId) && scene.getEntityRegistry().has<Component>(actorId);
}

template<typename Derived, typename Component>
Component &BaseBehavior<Derived, Component>::getComponent(ActorId actorId) {
  if constexpr (Scene::debugChecks) {
    if (!hasComponent(actorId)) {
      fmt::print("getComponent: actor doesn't have a component for this behavior");
    }
  }
  return scene.getEntityRegistry().get<Component>(actorId);
}

template<typename Derived, typename Component>
const Component &BaseBehavior<Derived, Component>::getComponent(ActorId actorId) const {
  if constexpr (Scene::debugChecks) {
    if (!hasComponent(actorId)) {
      fmt::print("getComponent: actor doesn't have a component for this behavior");
    }
  }
  return scene.getEntityRegistry().get<Component>(actorId);
}
