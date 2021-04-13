#pragma once

#include "precomp.h"

#include "behaviors/base.h"
#include "props.h"


//
// Behavior
//

struct BaseResponse; // Forward declaration

struct RulesComponent : BaseComponent {
  struct Props {
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
  // Root responses

  std::unordered_map<void *, std::unique_ptr<BaseResponse>> roots;


  // Loaders

  template<typename T>
  friend struct RuleRegistration;

  friend struct BaseResponse;

  struct TriggerLoader {
    entt::hashed_string nameHs;
    int behaviorId = -1;
    void (*read)(Scene &scene, ActorId actorId, BaseResponse *response, Reader &reader) = nullptr;
  };
  inline static std::vector<TriggerLoader> triggerLoaders;

  struct ResponseLoader {
    entt::hashed_string nameHs;
    int behaviorId = -1;
    std::unique_ptr<BaseResponse> (*read)(Reader &reader) = nullptr;
  };
  inline static std::vector<ResponseLoader> responseLoaders;
};


//
// Triggering
//

template<typename T>
struct TriggerComponent {
  // Actors that have rules with triggers of type `T` have this component, linking them to the
  // responses to execute for that trigger. Also enables fast searches for actors with a given
  // trigger type. Since there can be multiple rules with the same trigger type on an actor, this
  // component has multiple 'entries', one per rule, each with the parameters of the trigger and the
  // response to execute for that rule.
  //
  // Usually added when reading the rules of an actor, but may also be added or removed dynamically
  // (eg. `TriggerComponent<CreateTrigger>` is removed once the create trigger is run so it's never
  // run twice).

  struct Entry {
    T trigger;
    BaseResponse *response = nullptr;
  };
  SmallVector<Entry, 4> entries;
};


//
// Base rule types
//

struct BaseTrigger {
  // Base type of all triggers. Nothing here yet...
};

struct BaseResponse {
  virtual ~BaseResponse() = default;

  virtual void run() = 0;
};


//
// Registration
//

template<typename T>
struct RuleRegistration {
  // Registers a rule type (trigger, response or expression) for loading. Must be defined as an
  // `inline static const` member of the type so that registration occurs when the application
  // starts.

  RuleRegistration(const char *name, int behaviorId);
};


// Inlined implementations

template<typename T>
RuleRegistration<T>::RuleRegistration(const char *name, int behaviorId) {
  static_assert(std::is_base_of_v<BaseTrigger, T> || std::is_base_of_v<BaseResponse, T>,
      "RuleRegistration: type must derive from `BaseTrigger` or `BaseResponse`");
  if constexpr (std::is_base_of_v<BaseTrigger, T>) {
    // This is a trigger type
    RulesBehavior::triggerLoaders.push_back({
        entt::hashed_string(name),
        behaviorId,
        +[](Scene &scene, ActorId actorId, BaseResponse *response, Reader &reader) {
          // Add a `TriggerComponent<T>` entry for this rule
          auto &component
              = scene.getEntityRegistry().template get_or_emplace<TriggerComponent<T>>(actorId);
          component.entries.emplace_back();
          auto &entry = component.entries.back();
          entry.response = response;
          if constexpr (Props::hasProps<decltype(entry.trigger.params)>) {
            reader.obj("params", [&]() {
              reader.read(entry.trigger.params);
            });
          }
        },
    });
  } else if constexpr (std::is_base_of_v<BaseResponse, T>) {
    // This is a response type
    RulesBehavior::responseLoaders.push_back({
        entt::hashed_string(name),
        behaviorId,
        +[](Reader &reader) -> std::unique_ptr<BaseResponse> {
          // Initialize, read and return response
          auto response = std::make_unique<T>();
          if constexpr (Props::hasProps<decltype(response->params)>) {
            reader.obj("params", [&]() {
              reader.read(response->params);
            });
          }
          // TODO(nikki): Read `nextResponse`
          return response;
        },
    });
  }
}
