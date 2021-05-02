#pragma once

#include "precomp.h"

#include "scene.h"
#include "expressions/value.h"


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

  bool disabled = true;
};

template<typename Derived, typename Component>
class BaseBehavior {
  // The base class for all behavior types. Provides a bunch of utility methods that all behaviors
  // will probably want.

public:
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

  Component &addComponent(ActorId actorId); // Does nothing if already present
  void removeComponent(ActorId actorId); // Does nothing if not present
  bool hasComponent(ActorId actorId) const;

  void enableComponent(ActorId actorId);
  void disableComponent(ActorId actorId);
  bool hasAnyEnabledComponent() const;


  // Properties -- mostly meant for access from rules

  ExpressionValue getProperty(ActorId actorId, PropId propId) const;
  void setProperty(ActorId actorId, PropId propId, const ExpressionValue &value, bool relative);

  ExpressionValue handleGetProperty(
      ActorId actorId, const Component &component, PropId propId) const;
  void handleSetProperty(
      ActorId actorId, Component &component, PropId propId, const ExpressionValue &value);


  // Other behaviors

  AllBehaviors &getBehaviors();
  const AllBehaviors &getBehaviors() const;


  // Scene

  Scene &getScene();
  const Scene &getScene() const;


  // Gesture

  const Gesture &getGesture() const;


protected:
  // Own component data

  Component *maybeGetComponent(ActorId actorId); // Shortlived -- data may move on adding / removing
                                                 // components. Returns `nullptr` if not present.
  const Component *maybeGetComponent(ActorId actorId) const;

  template<typename F>
  void forEachEnabledComponent(F &&f); // `f` takes `(ActorId, Component &)` or (Component &)
  template<typename F>
  void forEachEnabledComponent(F &&f) const;


private:
  friend class Scene;
  friend class Snapshot;

  Scene &scene;
  entt::basic_view<entt::entity, entt::exclude_t<>, Component> componentView
      = scene.getEntityRegistry().template view<Component>();
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

// Lifecycle
DEFINE_HANDLER(EnableComponent);
DEFINE_HANDLER(DisableComponent);
DEFINE_HANDLER(PreRemoveActor);

// Read, write
DEFINE_HANDLER(ReadComponent);

// Perform
DEFINE_HANDLER(Perform);

// Physics contacts
DEFINE_HANDLER(BeginPhysicsContact);

// Draw
DEFINE_HANDLER(DrawComponent);
DEFINE_HANDLER(DrawOverlay);

#undef DEFINE_HANDLER
}


// Inlined implementations

template<typename Derived, typename Component>
Component &BaseBehavior<Derived, Component>::addComponent(ActorId actorId) {
  if (auto component = maybeGetComponent(actorId)) {
    Debug::log("addComponent: actor already has a component for this behavior");
    return *component;
  }
  return scene.getEntityRegistry().template emplace<Component>(actorId);
}

template<typename Derived, typename Component>
void BaseBehavior<Derived, Component>::removeComponent(ActorId actorId) {
  if (auto component = maybeGetComponent(actorId)) {
    // NOTE: Must be consistent with `BaseBehavior::disableComponent` and `Scene::removeActor`
    if constexpr (Handlers::hasDisableComponent<Derived>) {
      static_cast<Derived &>(*this).handleDisableComponent(actorId, *component, false);
    }
    scene.getEntityRegistry().template remove<Component>(actorId);
  } else {
    Debug::log("removeComponent: actor doesn't have a component for this behavior");
  }
}

template<typename Derived, typename Component>
bool BaseBehavior<Derived, Component>::hasComponent(ActorId actorId) const {
  return scene.hasActor(actorId) && componentView.contains(actorId);
}

template<typename Derived, typename Component>
void BaseBehavior<Derived, Component>::enableComponent(ActorId actorId) {
  if (auto component = maybeGetComponent(actorId); component && component->disabled) {
    component->disabled = false;
    if constexpr (Handlers::hasEnableComponent<Derived>) {
      static_cast<Derived &>(*this).handleEnableComponent(actorId, *component);
    }
  }
}

template<typename Derived, typename Component>
void BaseBehavior<Derived, Component>::disableComponent(ActorId actorId) {
  if (auto component = maybeGetComponent(actorId); component && !component->disabled) {
    // NOTE: Must be consistent with `BaseBehavior::removeComponent` and `Scene::removeActor`
    component->disabled = true;
    if constexpr (Handlers::hasDisableComponent<Derived>) {
      static_cast<Derived &>(*this).handleDisableComponent(actorId, *component, false);
    }
  }
}

template<typename Derived, typename Component>
bool BaseBehavior<Derived, Component>::hasAnyEnabledComponent() const {
  for (const auto &[actorId, component] : componentView.each()) {
    if (!component.disabled) {
      return true;
    }
  }
  return false;
}

template<typename Derived, typename Component>
Component *BaseBehavior<Derived, Component>::maybeGetComponent(ActorId actorId) {
  return hasComponent(actorId) ? &std::get<0>(componentView.get(actorId)) : nullptr;
}

template<typename Derived, typename Component>
const Component *BaseBehavior<Derived, Component>::maybeGetComponent(ActorId actorId) const {
  return hasComponent(actorId) ? &std::get<0>(componentView.get(actorId)) : nullptr;
}

template<typename Derived, typename Component>
template<typename F>
void BaseBehavior<Derived, Component>::forEachEnabledComponent(F &&f) {
  componentView.each(([&](ActorId actorId, Component &component) {
    if (!component.disabled) {
      if constexpr (std::is_invocable_v<F, ActorId, Component &>) {
        f(actorId, component);
      } else {
        f(component);
      }
    }
  }));
}

template<typename Derived, typename Component>
template<typename F>
void BaseBehavior<Derived, Component>::forEachEnabledComponent(F &&f) const {
  componentView.each(([&](ActorId actorId, const Component &component) {
    if (!component.disabled) {
      if constexpr (std::is_invocable_v<F, ActorId, const Component &>) {
        f(actorId, component);
      } else {
        f(component);
      }
    }
  }));
}

template<typename Derived, typename Component>
void BaseBehavior<Derived, Component>::setProperty(
    ActorId actorId, PropId propId, const ExpressionValue &value, bool relative) {
  if (auto component = maybeGetComponent(actorId)) {
    if (relative && value.is<double>()) {
      auto curr
          = static_cast<const Derived &>(*this).handleGetProperty(actorId, *component, propId);
      static_cast<Derived &>(*this).handleSetProperty(
          actorId, *component, propId, curr.template as<double>() + value.template as<double>());
    } else {
      static_cast<Derived &>(*this).handleSetProperty(actorId, *component, propId, value);
    }
  }
}

template<typename Derived, typename Component>
ExpressionValue BaseBehavior<Derived, Component>::getProperty(
    ActorId actorId, PropId propId) const {
  ExpressionValue result;
  if (auto component = maybeGetComponent(actorId)) {
    result = static_cast<const Derived &>(*this).handleGetProperty(actorId, *component, propId);
  }
  return result;
}

template<typename Derived, typename Component>
void BaseBehavior<Derived, Component>::handleSetProperty(
    ActorId actorId, Component &component, PropId propId, const ExpressionValue &value) {
  Props::forEach(component.props, [&](auto &prop) {
    if (propId == prop.id) {
      using PropValue = std::remove_reference_t<decltype(prop())>;
      if constexpr (std::is_same_v<bool, PropValue>) { // Prevent number-to-bool` conversion
        if (value.is<bool>()) {
          prop() = value.as<bool>();
        }
      } else if constexpr (std::is_arithmetic_v<PropValue>) { // All non-`bool` number types
        if (value.is<double>()) {
          prop() = value.as<double>();
        }
      }
    }
  });
}

template<typename Derived, typename Component>
ExpressionValue BaseBehavior<Derived, Component>::handleGetProperty(
    ActorId actorId, const Component &component, PropId propId) const {
  ExpressionValue result;
  Props::forEach(component.props, [&](auto &prop) {
    if (propId == prop.id) {
      using PropValue = std::remove_reference_t<decltype(prop())>;
      if constexpr (std::is_arithmetic_v<PropValue>) {
        result = ExpressionValue(prop());
      }
    }
  });
  return result;
}

template<typename Derived, typename Component>
AllBehaviors &BaseBehavior<Derived, Component>::getBehaviors() {
  return scene.getBehaviors();
}

template<typename Derived, typename Component>
const AllBehaviors &BaseBehavior<Derived, Component>::getBehaviors() const {
  return scene.getBehaviors();
}

template<typename Derived, typename Component>
Scene &BaseBehavior<Derived, Component>::getScene() {
  return scene;
}

template<typename Derived, typename Component>
const Scene &BaseBehavior<Derived, Component>::getScene() const {
  return scene;
}

template<typename Derived, typename Component>
const Gesture &BaseBehavior<Derived, Component>::getGesture() const {
  return scene.getGesture();
}
