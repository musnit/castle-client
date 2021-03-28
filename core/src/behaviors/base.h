#pragma once

#include "precomp.h"

#include "scene.h"


// Architectural notes. This may be over-engineering, still not sure. We'll see how it pans out.
//
//   - Only the behavior owning a component should have direct data access to the component. (eg.
//     `getComponent` is protected).
//   - Data access for other behaviors should go through a public API of that behavior that takes
//     `ActorId` and returns the data (eg. see `getPhysicsBody` in `BodyBehavior`).
//   - Might make sense for that data access to mostly be `const` (read-only),
//     and only use private members (so friend behaviors can access) for
//     read-write access?


struct BaseComponent {
  // The base class for all behavior component types.

  BaseComponent(const BaseComponent &) = delete; // Prevent accidental copies
  const BaseComponent &operator=(const BaseComponent &) = delete;
  BaseComponent(BaseComponent &&) = default; // Allow moves
  BaseComponent &operator=(BaseComponent &&) = default;

  bool disabled = false;
};

template<typename Derived, typename Component_>
class BaseBehavior {
  // The base class for all behavior types. Provides a bunch of utility methods that all behaviors
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


  // Physics world

  b2World &getPhysicsWorld();
  const b2World &getPhysicsWorld() const;


  // Other behaviors

  AllBehaviors &getBehaviors();
  const AllBehaviors &getBehaviors() const;


protected:
  // Own component data

  Component &getComponent(ActorId actorId); // Undefined behavior if not present!
  const Component &getComponent(ActorId actorId) const;
  Component *maybeGetComponent(ActorId actorId); // Returns `nullptr` if not present
  const Component *maybeGetComponent(ActorId actorId) const;

  template<typename F>
  void forEachComponent(F &&f); // `f` must take either `(ActorId, Component &)` or (Component &)
  template<typename F>
  void forEachComponent(F &&f) const;


private:
  friend class Scene;
  Scene &scene;
};


namespace Handlers {
// Handlers are methods on behavior classes that are called when some event occurs. The methods are
// all named like `handleSomeFoo`. All handler names must be listed here. Once a handler name
// `SomeFoo` is defined below, the following utilities become available:
//
//   Handlers::hasSomeFoo<BehaviorType>
//     Use to check whether type `BehaviorType` has `handleSomeFoo` defined. Can be used like
//     `hasSomeFoo<decltype(behaviorInstance)>` to check on an instance instead of a type. This is a
//     compile-time check (can be used with `if constexpr`), allowing eg. skipping generating a
//     certain block of code for a behavior that doesn't have a given handler.

#define DEFINE_HANDLER(name)                                                                       \
  template<typename T, typename = void>                                                            \
  inline constexpr auto has##name = false;                                                         \
  template<typename T>                                                                             \
  inline constexpr auto                                                                            \
      has##name<T, std::void_t<decltype(&std::remove_reference_t<T>::handle##name)>> = true;

DEFINE_HANDLER(AddComponent);
DEFINE_HANDLER(DisableComponent);
DEFINE_HANDLER(DrawComponent);

#undef DEFINE_HANDLER
}


// Inlined implementations

template<typename Derived, typename Component>
Component &BaseBehavior<Derived, Component>::addComponent(ActorId actorId) {
  if (auto component = maybeGetComponent(actorId)) {
    fmt::print("addComponent: actor already has a component for this behavior\n");
    return *component;
  }
  auto &component = scene.getEntityRegistry().emplace<Component>(actorId);
  if constexpr (Handlers::hasAddComponent<Derived>) {
    static_cast<Derived &>(*this).handleAddComponent(actorId, component);
  }
  return component;
}

template<typename Derived, typename Component>
void BaseBehavior<Derived, Component>::removeComponent(ActorId actorId) {
  if (auto component = maybeGetComponent(actorId)) {
    // NOTE: If adding more steps here, make sure `Scene::removeActor` is in sync
    if constexpr (Handlers::hasDisableComponent<Derived>) {
      static_cast<Derived &>(*this).handleDisableComponent(actorId, *component, false);
    }
    scene.getEntityRegistry().remove<Component>(actorId);
  } else {
    fmt::print("removeComponent: actor doesn't have a component for this behavior\n");
  }
}

template<typename Derived, typename Component>
bool BaseBehavior<Derived, Component>::hasComponent(ActorId actorId) const {
  return scene.hasActor(actorId) && scene.getEntityRegistry().has<Component>(actorId);
}

template<typename Derived, typename Component>
Component &BaseBehavior<Derived, Component>::getComponent(ActorId actorId) {
  if constexpr (Scene::debugChecks) {
    if (!hasComponent(actorId)) {
      fmt::print("getComponent: actor doesn't have a component for this behavior\n");
    }
  }
  return scene.getEntityRegistry().get<Component>(actorId);
}

template<typename Derived, typename Component>
const Component &BaseBehavior<Derived, Component>::getComponent(ActorId actorId) const {
  if constexpr (Scene::debugChecks) {
    if (!hasComponent(actorId)) {
      fmt::print("getComponent: actor doesn't have a component for this behavior\n");
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

template<typename Derived, typename Component>
b2World &BaseBehavior<Derived, Component>::getPhysicsWorld() {
  return scene.getPhysicsWorld();
}

template<typename Derived, typename Component>
const b2World &BaseBehavior<Derived, Component>::getPhysicsWorld() const {
  return scene.getPhysicsWorld();
}

template<typename Derived, typename Component>
AllBehaviors &BaseBehavior<Derived, Component>::getBehaviors() {
  return scene.getBehaviors();
}

template<typename Derived, typename Component>
const AllBehaviors &BaseBehavior<Derived, Component>::getBehaviors() const {
  return scene.getBehaviors();
}
