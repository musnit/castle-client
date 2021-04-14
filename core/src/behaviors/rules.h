#pragma once

#include "precomp.h"

#include "behaviors/base.h"
#include "props.h"


struct BaseResponse; // Forward declarations
using ResponseRef = BaseResponse *;


//
// Behavior
//

struct RulesComponent : BaseComponent {
  struct Props {
  } props;
};

class RulesBehavior : public BaseBehavior<RulesBehavior, RulesComponent> {
public:
  static constexpr char name[] = "Rules";

  using BaseBehavior::BaseBehavior;

  RulesBehavior(RulesBehavior &&) = default; // Allow move construction

  ~RulesBehavior();


  void handleDisableComponent(ActorId actorId, RulesComponent &component, bool removeActor);

  void handleReadComponent(ActorId actorId, RulesComponent &component, Reader &reader);

  void handlePerform(double dt);


private:
  // Using a pool allocator for rule nodes (responses and expressions) since we'll be allocating a
  // lot of small objects and visiting them somewhat in order when running. Also keep track of the
  // pointers so we can call destructors later, since the pool itself will only drop the memory
  // without destructing objects.
  json::MemoryPoolAllocator<json::CrtAllocator> pool;
  std::vector<ResponseRef> responses;

  // Map from JSON object pointer to loaded responses. Allows us to reuse response instances loaded
  // from the same JSON instance -- which happens every time we create an actor that inherits rules
  // from a previously loaded blueprint. Value may be `nullptr` if loading the response failed --
  // still helps to cache that it failed.
  std::unordered_map<void *, ResponseRef> responseCache;


  // Loaders (maps from names to read functions for rule types, filled by `RuleRegistration` when
  // the application starts)

  template<typename T>
  friend struct RuleRegistration;

  struct TriggerLoader {
    entt::hashed_string nameHs;
    int behaviorId = -1;
    void (*read)(Scene &scene, ActorId actorId, ResponseRef response, Reader &reader) = nullptr;
  };
  inline static std::vector<TriggerLoader> triggerLoaders;

  struct ResponseLoader {
    entt::hashed_string nameHs;
    int behaviorId = -1;
    ResponseRef (*read)(RulesBehavior &rules, Reader &reader) = nullptr;
  };
  inline static std::vector<ResponseLoader> responseLoaders;

  ResponseRef readResponse(Reader &reader);
};


//
// Triggering
//

template<typename T>
struct TriggerComponent {
  // Actors that have rules with triggers of type `T` have this component, linking them to the
  // response to run for that trigger. Also enables fast searches for actors with a given trigger
  // type.
  //
  // Since there can be multiple rules with the same trigger type on an actor, this component has
  // multiple 'entries', one per rule, each with the parameters of the trigger and a reference to
  // the response to run for that rule.
  //
  // Usually added when reading the rules of an actor, but may also be added or removed dynamically
  // (eg. `TriggerComponent<CreateTrigger>` is removed once the create trigger is run so it's never
  // run twice).

  struct Entry {
    T trigger;
    ResponseRef response = nullptr;
  };
  SmallVector<Entry, 4> entries;
};


//
// Base rule types
//

struct BaseTrigger {};

struct BaseResponse {
  virtual ~BaseResponse() = default;

  void runChain(); // Run this response and then run the next responses after it


private:
  template<typename T>
  friend struct RuleRegistration;

  ResponseRef next = nullptr;

  virtual void run() = 0; // Run this response, and not next ones. Overridden in response types.
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

inline void BaseResponse::runChain() {
  run();
  if (next) {
    next->runChain();
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
        [](Scene &scene, ActorId actorId, ResponseRef response, Reader &reader) {
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
        [](RulesBehavior &rules, Reader &reader) -> ResponseRef {
          // Initialize a new response, read params and return
          auto response = (T *)rules.pool.Malloc(sizeof(T));
          new (response) T();
          rules.responses.emplace_back(response);
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
