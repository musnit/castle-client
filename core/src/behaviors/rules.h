#pragma once

#include "precomp.h"

#include "behaviors/base.h"
#include "props.h"


struct BaseResponse; // Forward declarations
using ResponseRef = BaseResponse *;


//
// Context
//

struct RuleContext {
  // Holds local values for one invocation of a response or expression. Passed to the `run(...)`
  // method of responses or the `eval(...)` method of expressions.

  RuleContext(const RuleContext &) = delete; // Prevent accidental copies
  RuleContext &operator=(const RuleContext &) = delete;
  RuleContext(RuleContext &&) = default; // Allow moves
  RuleContext &operator=(RuleContext &&) = default;

  ActorId actorId;

  Scene &getScene();


private:
  friend class RulesBehavior;

  Scene *scene; // Needs to be a pointer and not a reference to preserve move assignment for
                // `std::remove_if`

  RuleContext(ActorId actorId_, Scene &scene_)
      : actorId(actorId_)
      , scene(&scene_) {
  }
};


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


  void handlePreRemoveActor(ActorId actorId, RulesComponent &component);

  void handleReadComponent(ActorId actorId, RulesComponent &component, Reader &reader);

  void handlePerform(double dt);


  // Trigger firing

  template<typename Trigger, typename... Component>
  void fireAll(); // Fire on all actors that have trigger and components
  template<typename Trigger, typename... Component, typename F>
  void fireAllIf(F &&filter); // Like above but also `filter` must return `true`.
                              // `F` is `(ActorId, const Trigger &, const Component &...) -> bool`

  template<typename Trigger>
  void fire(ActorId actorId); // Fire on single actor if has trigger
  template<typename Trigger, typename F>
  void fireIf(ActorId actorId, F &&filter); // Like above but also `filter` must return `true`
                                            // `F` is `(const Trigger &) -> bool`


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


  // Threads

  struct Thread {
    // A thread is an invocation of a response scheduled to run soon along with its context

    double scheduledPerformTime; // `Scene::getPerformTime()` at or after which this thread should
                                 // be run. Perform time is always >= 0, so 0 means run immediately.
    ResponseRef response = nullptr;
    RuleContext ctx;
  };
  std::vector<Thread> scheduled; // All threads scheduled to run soon
  std::vector<Thread> current; // A temporary list of threads to run in the current frame. Stored as
                               // a member so we can reuse its memory from frame to frame.


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
    ResponseRef (*read)(RulesBehavior &rulesBehavior, Reader &reader) = nullptr;
  };
  inline static std::vector<ResponseLoader> responseLoaders;

  ResponseRef readResponse(Reader &reader);
};


//
// Triggering
//

template<typename Trigger>
struct TriggerComponent {
  // Actors that have rules with triggers of type `Trigger` have this component, linking them to the
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
    Trigger trigger;
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

  void runChain(const RuleContext &ctx); // Run this response and then next responses after it


private:
  template<typename T>
  friend struct RuleRegistration;

  ResponseRef next = nullptr;

  virtual void run(const RuleContext &ctx) = 0; // Run only this response, and not next ones.
                                                // Implemented in concrete response types.
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

private:
  inline static bool registered = false; // To catch erroneous double-registration of the same type
};


// Inlined implementations

inline Scene &RuleContext::getScene() {
  return *scene;
}

template<typename Trigger, typename... Component>
void RulesBehavior::fireAll() {
  fireAllIf<Trigger, Component...>([](const auto &...) {
    return true;
  });
}

template<typename Trigger, typename... Component, typename F>
void RulesBehavior::fireAllIf(F &&filter) {
  auto &scene = getScene();
  scene.getEntityRegistry().view<const TriggerComponent<Trigger>, const Component...>().each(
      [&](ActorId actorId, const TriggerComponent<Trigger> &component, const auto &...rest) {
        for (auto &entry : component.entries) {
          if (filter(actorId, entry.trigger, rest...)) {
            scheduled.push_back(Thread { 0, entry.response, RuleContext { actorId, scene } });
          }
        }
      });
}

template<typename Trigger>
void RulesBehavior::fire(ActorId actorId) {
  fireIf<Trigger>(actorId, [](const auto &) {
    return true;
  });
}

template<typename Trigger, typename F>
void RulesBehavior::fireIf(ActorId actorId, F &&filter) {
  auto &scene = getScene();
  if (auto maybeComponent
      = getScene().getEntityRegistry().try_get<TriggerComponent<Trigger>>(actorId)) {
    for (auto &entry : maybeComponent->entries) {
      if (filter((const Trigger &)entry.trigger)) {
        scheduled.push_back(Thread { 0, entry.response, RuleContext { actorId, scene } });
      }
    }
  }
}

inline void BaseResponse::runChain(const RuleContext &ctx) {
  run(ctx);
  if (next) {
    next->runChain(ctx);
  }
}

template<typename T>
RuleRegistration<T>::RuleRegistration(const char *name, int behaviorId) {
  static_assert(std::is_base_of_v<BaseTrigger, T> || std::is_base_of_v<BaseResponse, T>,
      "RuleRegistration: type must derive from `BaseTrigger` or `BaseResponse`");
  if (registered) {
    fmt::print("RuleRegistration: tried to register the same type twice -- make sure you're using "
               "the correct `T` in `RuleRegistration<T>` (must be the same as the containing "
               "`struct` or `class`)\n");
    std::abort();
  }
  registered = true;
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
        [](RulesBehavior &rulesBehavior, Reader &reader) -> ResponseRef {
          // Initialize a new response, read params and return
          auto response = (T *)rulesBehavior.pool.Malloc(sizeof(T));
          new (response) T();
          rulesBehavior.responses.emplace_back(response);
          reader.obj("params", [&]() {
            // Reflected props
            if constexpr (Props::hasProps<decltype(response->params)>) {
              reader.read(response->params);
            }

            // Child responses
            reader.obj("nextResponse", [&]() {
              response->next = rulesBehavior.readResponse(reader);
            });
          });
          return response;
        },
    });
  }
}
