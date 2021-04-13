#pragma once

#include "precomp.h"

#include "behaviors/base.h"
#include "props.h"


struct RulesComponent : BaseComponent {
  struct Props {
    // Rules are read in `handleComponentRead`, no props here
  } props;
};

class RulesBehavior : public BaseBehavior<RulesBehavior, RulesComponent> {
public:
  static constexpr char name[] = "Rules";

  using BaseBehavior::BaseBehavior;


  void handleDisableComponent(ActorId actorId, RulesComponent &component, bool removeActor);

  void handleReadComponent(ActorId actorId, RulesComponent &component, Reader &reader);

  void handlePerform(double dt);


private:
  template<typename T>
  friend struct RuleRegistration; // Allow adding to loaders

  struct TriggerLoader {
    entt::hashed_string nameHs;
    int behaviorId = -1;
    void (*read)(Scene &scene, ActorId actorId, Reader &reader) = nullptr;
  };
  inline static std::vector<TriggerLoader> triggerLoaders;
};


struct BaseTrigger {
  // Base type of all triggers. Nothing here yet...
};

template<typename T>
struct TriggerComponent {
  // Has entries for each rule with a trigger of type `T` on an actor. Includes the parameters of
  // the trigger along with the id of the body to execute.

  struct Entry {
    T trigger;
    // TODO(nikki): Add id of rule body
  };
  SmallVector<Entry, 8> entries;
};

template<typename T>
struct RuleRegistration {
  // Registers a rule entity (trigger, response or expression) for loading. Must be defined as an
  // `inline static const` member of the type so it's constructed when the application starts.

  RuleRegistration(const char *name, int behaviorId);
};


// Inlined implementations

template<typename T>
RuleRegistration<T>::RuleRegistration(const char *name, int behaviorId) {
  if constexpr (std::is_base_of_v<BaseTrigger, T>) { // Trigger
    RulesBehavior::triggerLoaders.push_back({
        entt::hashed_string(name),
        behaviorId,
        +[](Scene &scene, ActorId actorId, Reader &reader) {
          auto &component
              = scene.getEntityRegistry().template get_or_emplace<TriggerComponent<T>>(actorId);
          component.entries.emplace_back();
          auto &entry = component.entries.back();
          if constexpr (Props::hasProps<decltype(entry.trigger.params)>) {
            reader.obj("params", [&]() {
              reader.read(entry.trigger.params);
            });
          }
        },
    });
  }
}
