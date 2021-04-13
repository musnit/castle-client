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


  // Loaders (maps from names to read functions for rule types)

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
    std::unique_ptr<BaseResponse> (*read)(RulesBehavior &rules, Reader &reader) = nullptr;
  };
  inline static std::vector<ResponseLoader> responseLoaders;

  std::unique_ptr<BaseResponse> readResponse(Reader &reader);
};


//
// Triggering
//

template<typename T>
struct TriggerComponent {
  // Actors that have rules with triggers of type `T` have this component, linking them to the
  // response to execute for that trigger. Also enables fast searches for actors with a given
  // trigger type.
  //
  // Since there can be multiple rules with the same trigger type on an actor, this component has
  // multiple 'entries', one per rule, each with the parameters of the trigger and the response to
  // execute for that rule.
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

struct BaseTrigger {};

using ResponseRef = std::unique_ptr<BaseResponse>;

struct BaseResponse {
  virtual ~BaseResponse() = default;

  void run(int);

private:
  template<typename T>
  friend struct RuleRegistration;

  ResponseRef next = nullptr;

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

inline void BaseResponse::run(int) {
  run();
  if (next) {
    next->run(0); // Hopefully this compiles to a tail call...
  }
}

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

          // Read params
          if constexpr (Props::hasProps<decltype(entry.trigger.params)>) {
            // Reflected props
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
        +[](RulesBehavior &rules, Reader &reader) -> std::unique_ptr<BaseResponse> {
          // Initialize a new response, read params and return
          auto response = std::make_unique<T>();
          reader.obj("params", [&]() {
            // Reflected props
            if constexpr (Props::hasProps<decltype(response->params)>) {
              reader.read(response->params);
            }

            // Child responses
            reader.obj("nextResponse", [&]() {
              response->next = rules.readResponse(reader);
            });
          });
          return response;
        },
    });
  }
}
