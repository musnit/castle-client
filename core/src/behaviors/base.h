#pragma once

#include "precomp.h"

#include "scene.h"


struct BaseComponent {
  bool disabled = false;
};

template<typename Derived, typename Component_>
class BaseBehavior {
  // The base class for all behavior classes. Provides a bunch of utility methods that all behaviors
  // will probably want.

public:
  using Component = Component_;
  static_assert(std::is_base_of_v<BaseComponent, Component>,
      "A behavior's component type must derive from `BaseComponent`");


  BaseBehavior(const BaseBehavior &) = delete; // Prevent accidental copies
  const BaseBehavior &operator=(const BaseBehavior &) = delete;
  BaseBehavior(BaseBehavior &&) = default; // Allow moves
  BaseBehavior &operator=(BaseBehavior &&) = default;

  explicit BaseBehavior(Scene &scene_)
      : scene(scene_) {
  }


  // Component management

  Component &addComponent(ActorId actorId); // Does nothing and returns existing if already present
  void removeComponent(ActorId actorId); // Does nothing if not present

  bool hasComponent(ActorId actorId) const;
  Component &getComponent(ActorId actorId); // Undefined behavior if not present!
  const Component &getComponent(ActorId actorId) const;
  Component *maybeGetComponent(ActorId actorId); // Returns `nullptr` if not present
  const Component *maybeGetComponent(ActorId actorId) const;

  template<typename F>
  void forEachComponent(F &&f); // `f` must take either `(ActorId, Component &)` or (Component &)
  template<typename F>
  void forEachComponent(F &&f) const;


  // Handlers

  void handleAddComponent(ActorId, Component &) {
  }
  void handleDisableComponent(ActorId, Component &, [[maybe_unused]] bool removeActor) {
  }


private:
  Scene &scene;
};


// Inlined implementations

template<typename Derived, typename Component>
Component &BaseBehavior<Derived, Component>::addComponent(ActorId actorId) {
  if (auto component = maybeGetComponent(actorId)) {
    fmt::print("addComponent: actor already has a component for this behavior");
    return *component;
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
  // NOTE: If adding more steps here, make sure `Scene::removeActor` is in sync
  static_cast<Derived &>(*this).handleDisableComponent(actorId, getComponent(actorId), false);
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

template<typename Derived, typename Component>
Component *BaseBehavior<Derived, Component>::maybeGetComponent(ActorId actorId) {
  return scene.getEntityRegistry().try_get<Component>(actorId);
}

template<typename Derived, typename Component>
const Component *BaseBehavior<Derived, Component>::maybeGetComponent(ActorId actorId) const {
  return scene.getEntityRegistry().try_get<Component>(actorId);
}

template<typename Derived, typename Component>
template<typename F>
void BaseBehavior<Derived, Component>::forEachComponent(F &&f) {
  scene.getEntityRegistry().view<Component>().each(std::forward<F>(f));
}

template<typename Derived, typename Component>
template<typename F>
void BaseBehavior<Derived, Component>::forEachComponent(F &&f) const {
  scene.getEntityRegistry().view<const Component>().each(std::forward<F>(f));
}
