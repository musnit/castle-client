#pragma once

#include "precomp.h"

#include "behaviors/base.h"
#include "props.h"
#include "expressions/value.h"


//
// References
//

struct BaseResponse; // Forward declarations
struct BaseExpression;
class RuleContext;

using ResponseRef = BaseResponse *; // Type for referencing other responses from responses
template<>
constexpr auto Archive::skipProp<ResponseRef> = true; // Don't auto-read `ResponseRef`s, we'll do
                                                      // that with special logic

struct ExpressionRef {
  // Type for referencing expressions from responses. We use a wrapper type here rather than a raw
  // `BaseResponse *` so it can hold a default value and embed constants directly.

  ExpressionRef(ExpressionValue constant_ = 0); // NOLINT(google-explicit-constructor)

  ExpressionValue eval(RuleContext &ctx);

  template<typename T>
  T eval(RuleContext &ctx); // Falls back to constant if child expression returns wrong type


private:
  friend class RulesBehavior;
  template<typename T, typename Behavior>
  friend struct RuleRegistration;

  BaseExpression *maybeExpression = nullptr; // A child expression node, if we actually have one
  ExpressionValue constant = 0; // The constant value if no child node
};
template<>
constexpr auto Archive::skipProp<ExpressionRef> = true; // Don't auto-read `ExpressionRef`s, we'll
                                                        // do that with special logic


//
// Context
//

struct RuleContextExtras {
  // Extra data held in a rule context, usually passed in at the trigger site. We'll can make this
  // more dynamically typed and extendable in the future, but for now all we've needed is
  // `otherActorId`.

  ActorId otherActorId = nullActor;
};

class RuleContext {
  // Holds local values for one invocation of a response or expression. Passed to the `run(...)`
  // method of responses or the `eval(...)` method of expressions.

public:
  RuleContext(const RuleContext &) = delete; // Prevent accidental copies
  RuleContext &operator=(const RuleContext &) = delete;
  RuleContext(RuleContext &&) = default; // Allow moves
  RuleContext &operator=(RuleContext &&) = default;


  ActorId actorId; // Actor on whom the response should act
  RuleContextExtras extras; // Extra information this context carries


  struct RepeatStackElem {
    ResponseRef response = nullptr; // The response we're associated with
    int count = 0; // Remaining repetions. For 'infinite repeat' this is 1 to continue or 0 to stop.
  };
  SmallVector<RepeatStackElem, 2> repeatStack; // Tracks enclosing repeat responses in progress

  struct ActOnStackElem {
    ResponseRef response = nullptr; // The response we're associated with
    int index = 0; // Which index in the actor set to visit next
    ActorId returnActorId = nullActor; // Which actor to return to when done
  };
  SmallVector<ActOnStackElem, 2> actOnStack; // Tracks enclosing act-on responses in progress


  Scene &getScene() const;

  void setNext(ResponseRef newNext); // Set next response to run when this context is resumed
  RuleContext suspend(); // Pauses this context and returns a copy that can be re-scheduled


private:
  friend class RulesBehavior;

  ResponseRef next = nullptr;

  Scene *scene;

  RuleContext(ResponseRef next_, ActorId actorId_, RuleContextExtras extras_, Scene &scene_);

  void run();
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
  static constexpr auto name = "Rules";
  static constexpr auto behaviorId = 16;

  using BaseBehavior::BaseBehavior;

  RulesBehavior(RulesBehavior &&) = default; // Allow move construction

  ~RulesBehavior();


  void handlePreRemoveActor(ActorId actorId, RulesComponent &component);

  void handleReadComponent(ActorId actorId, RulesComponent &component, Reader &reader);

  void handlePerform(double dt);


  // Trigger firing -- all methods return whether any triggers were actually fired

  template<typename Trigger, typename... Component>
  bool fireAllEnabled(RuleContextExtras extras); // Fire on all with trigger and enabled components
  template<typename Trigger, typename... Component, typename F>
  bool fireAllIf(RuleContextExtras extras,
      F &&filter); // Like above but also `filter` must return `true`.
                   // `F` is `(ActorId, const Trigger &, const Component &...) -> bool`

  template<typename Trigger>
  bool fire(ActorId actorId, RuleContextExtras extras); // Fire on single actor if has trigger
  template<typename Trigger, typename F>
  bool fireIf(ActorId actorId, RuleContextExtras extras,
      F &&filter); // Like above but also `filter` must return `true`
                   // `F` is `(const Trigger &) -> bool`


  // Response scheduling

  void schedule(RuleContext ctx,
      double performTime = 0); // `performTime` is absolute `Scene::getPerformTime()` at or after
                               // which the response should be run. 0 means run immediately.


private:
  // Using a pool allocator for rule nodes (responses and expressions) since we'll be allocating a
  // lot of small objects and visiting them somewhat in order when running. Also keep track of the
  // pointers so we can call destructors later, since the pool itself will only drop the memory
  // without destructing objects.
  json::MemoryPoolAllocator<json::CrtAllocator> pool;
  std::vector<ResponseRef> responses;
  std::vector<BaseExpression *> expressions;

  // Map from JSON object pointer to loaded responses. Allows us to reuse response instances loaded
  // from the same JSON instance -- which happens every time we create an actor that inherits rules
  // from a previously loaded blueprint. Value may be `nullptr` if loading the response failed --
  // still helps to cache that it failed.
  std::unordered_map<void *, ResponseRef> responseCache;


  // Scheduling

  struct Scheduled {
    // A context scheduled to run soon
    RuleContext ctx;
    double performTime = 0;
  };
  std::vector<Scheduled> scheduleds;
  std::vector<RuleContext> current; // A temporary list of contexts to run in the current frame.
                                    // Stored as a member so we can reuse its memory.


  // Loaders (maps from names to read functions for rule types, filled by `RuleRegistration` when
  // the application starts)

  template<typename T, typename Behavior>
  friend struct RuleRegistration; // To let it write to loaders

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

  struct ExpressionLoader {
    entt::hashed_string nameHs;
    void (*read)(ExpressionRef &expr, RulesBehavior &rulesBehavior, Reader &reader) = nullptr;
  };
  inline static std::vector<ExpressionLoader> expressionLoaders;

  ResponseRef readResponse(Reader &reader);
  void readExpression(ExpressionRef &expr, Reader &reader);


  // Triggering

  template<typename Trigger>
  struct TriggerComponent {
    // Actors that have rules with triggers of type `Trigger` have this component, linking them to
    // the response to run for that trigger. Also enables fast searches for actors with a given
    // trigger type.
    //
    // Since there can be multiple rules with the same trigger type on an actor, this component has
    // multiple 'entries', one per rule, each with the parameters of the trigger and a reference to
    // the response to run for that rule.
    //
    // Usually added when reading the rules of an actor, but may also be added or removed
    // dynamically (eg. `TriggerComponent<CreateTrigger>` is removed once the create trigger is run
    // so it's never run twice).

    struct Entry {
      Trigger trigger;
      ResponseRef response = nullptr;
    };
    SmallVector<Entry, 4> entries;
  };
};


//
// Base trigger
//

struct BaseTrigger {
  // Base for all trigger types. Derive from this and include a `RuleRegistration` to define a new
  // trigger type.
};


//
// Base response
//

struct BaseResponse {
  // Base for all response types. Derive from this and include a `RuleRegistration` to define a new
  // response type.

  virtual ~BaseResponse() = default;

  // Evaluate as a boolean expression. Only exists to account for legacy responses with
  // `returnType = "boolean"` -- those should eventually just become actual expressions.
  virtual bool eval(RuleContext &ctx);


protected:
  // 'Flatten' the tree so resuming suspended response chains continues parent branches
  virtual void linearize(ResponseRef continuation);
  static void linearize(ResponseRef &target, ResponseRef continuation);

  ResponseRef next = nullptr; // The response to run after this one, if any


private:
  friend class RuleContext;
  friend class RulesBehavior;
  template<typename T, typename Behavior>
  friend struct RuleRegistration;

  // Run the response. Just runs this response and not next ones. Implemented in concrete types.
  virtual void run(RuleContext &ctx);
};


//
// Base expression
//

struct BaseExpression {
  // Base for all expression types. Derive from this and include a `RuleRegistration` to define a
  // new expression type.

  virtual ~BaseExpression() = default;


private:
  friend struct ExpressionRef;

  // Evaluate the expression. Implemented in concrete types.
  virtual ExpressionValue eval(RuleContext &ctx);
};


//
// Registration
//

template<typename T, typename Behavior = void>
struct RuleRegistration {
  // Registers a rule type (trigger, response or expression) for loading. Must be defined as an
  // `inline static const` member of the type so that registration occurs when the application
  // starts.

  explicit RuleRegistration(const char *name);

private:
  inline static bool registered = false; // To catch erroneous double-registration of the same type
};


// Inlined implementations

inline ExpressionRef::ExpressionRef(ExpressionValue constant_)
    : constant(constant_) {
}

inline ExpressionValue ExpressionRef::eval(RuleContext &ctx) {
  if (maybeExpression) {
    return maybeExpression->eval(ctx);
  } else {
    return constant;
  }
}

template<typename T>
T ExpressionRef::eval(RuleContext &ctx) {
  if (maybeExpression) {
    if (auto result = maybeExpression->eval(ctx); result.is<T>()) {
      return result.as<T>();
    }
  }
  return constant.as<T>();
}

inline Scene &RuleContext::getScene() const {
  return *scene;
}

inline void RuleContext::setNext(ResponseRef newNext) {
  next = newNext;
}

inline RuleContext RuleContext::suspend() {
  auto result = std::move(*this);
  next = nullptr;
  return result;
}

inline RuleContext::RuleContext(
    ResponseRef next_, ActorId actorId_, RuleContextExtras extras_, Scene &scene_)
    : actorId(actorId_)
    , extras(extras_)
    , next(next_)
    , scene(&scene_) {
}

template<typename Trigger, typename... Component>
bool RulesBehavior::fireAllEnabled(RuleContextExtras extras) {
  return fireAllIf<Trigger, Component...>(
      extras, [](ActorId, const Trigger &, const auto &...component) {
        return (!component.disabled && ...);
      });
}

template<typename Trigger, typename... Component, typename F>
bool RulesBehavior::fireAllIf(RuleContextExtras extras, F &&filter) {
  auto fired = false;
  auto &scene = getScene();
  scene.getEntityRegistry().view<const TriggerComponent<Trigger>, const Component...>().each(
      [&](ActorId actorId, const TriggerComponent<Trigger> &triggerComponent, const auto &...rest) {
        for (auto &entry : triggerComponent.entries) {
          if (filter(actorId, entry.trigger, rest...)) {
            schedule({ entry.response, actorId, extras, scene });
            fired = true;
          }
        }
      });
  return fired;
}

template<typename Trigger>
bool RulesBehavior::fire(ActorId actorId, RuleContextExtras extras) {
  return fireIf<Trigger>(actorId, extras, [](const auto &) {
    return true;
  });
}

template<typename Trigger, typename F>
bool RulesBehavior::fireIf(ActorId actorId, RuleContextExtras extras, F &&filter) {
  auto fired = false;
  auto &scene = getScene();
  if (!scene.hasActor(actorId)) {
    return false;
  }
  if (auto triggerComponent
      = scene.getEntityRegistry().try_get<TriggerComponent<Trigger>>(actorId)) {
    for (auto &entry : triggerComponent->entries) {
      if (filter((const Trigger &)entry.trigger)) {
        schedule({ entry.response, actorId, extras, scene });
        fired = true;
      }
    }
  }
  return fired;
}

inline void RulesBehavior::schedule(RuleContext ctx, double performTime) {
  if (ctx.next) {
    scheduleds.push_back({ std::move(ctx), performTime });
  }
}

inline bool BaseResponse::eval(RuleContext &ctx) {
  return false;
}

inline void BaseResponse::linearize(ResponseRef continuation) {
  linearize(next, continuation);
}

inline void BaseResponse::linearize(ResponseRef &target, ResponseRef continuation) {
  if (target) {
    target->linearize(continuation);
  } else {
    target = continuation;
  }
}

inline void BaseResponse::run(RuleContext &ctx) {
}

inline ExpressionValue BaseExpression::eval(RuleContext &ctx) {
  return 0;
}

template<typename T, typename Behavior>
RuleRegistration<T, Behavior>::RuleRegistration(const char *name) {
  static_assert(
      std::is_base_of_v<BaseTrigger,
          T> || std::is_base_of_v<BaseResponse, T> || std::is_base_of_v<BaseExpression, T>,
      "RuleRegistration: type must derive from `BaseTrigger`, `BaseResponse` or `BaseExpression`");
  if (registered) {
    Debug::fatal("RuleRegistration: tried to register the same type twice -- make sure you're "
                 "using the correct `T` in `RuleRegistration<T, ...>` (must be the same as the "
                 "containing `struct` or `class`)");
  }
  registered = true;
  if constexpr (std::is_base_of_v<BaseTrigger, T>) {
    // This is a trigger type
    RulesBehavior::triggerLoaders.push_back({
        entt::hashed_string(name),
        Behavior::behaviorId,
        [](Scene &scene, ActorId actorId, ResponseRef response, Reader &reader) {
          // Add a `TriggerComponent<T>` entry for this rule
          auto &component
              = scene.getEntityRegistry()
                    .template get_or_emplace<RulesBehavior::TriggerComponent<T>>(actorId);
          component.entries.emplace_back();
          auto &entry = component.entries.back();
          entry.response = response;

          // Read params
          if constexpr (Props::hasProps<typename T::Params>) {
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
        Behavior::behaviorId,
        [](RulesBehavior &rulesBehavior, Reader &reader) -> ResponseRef {
          // Initialize a new response, read params and return
          auto response = (T *)rulesBehavior.pool.Malloc(sizeof(T));
          new (response) T();
          rulesBehavior.responses.emplace_back(response);
          reader.obj("params", [&]() {
            // Reflect on `params`
            if constexpr (Props::hasProps<typename T::Params>) {
              reader.each([&](const char *key) {
                const auto keyHash = entt::hashed_string(key).value();
                Props::forEach(response->params, [&](auto &prop) {
                  using Prop = std::remove_reference_t<decltype(prop)>;
                  constexpr auto propNameHash = Prop::nameHash; // Ensure compile-time constants
                  constexpr auto propName = Prop::name;
                  if (keyHash == propNameHash && key == propName) {
                    if constexpr (std::is_same_v<ResponseRef,
                                      std::remove_reference_t<decltype(prop())>>) {
                      // Child response
                      prop() = rulesBehavior.readResponse(reader);
                    } else if constexpr (std::is_same_v<ExpressionRef,
                                             std::remove_reference_t<decltype(prop())>>) {
                      // Child expression
                      rulesBehavior.readExpression(prop(), reader);
                    } else {
                      // Regular prop
                      reader.read(prop());
                    }
                  }
                });
              });
            }

            // Next response
            reader.obj("nextResponse", [&]() {
              response->next = rulesBehavior.readResponse(reader);
            });
          });
          return response;
        },
    });
  } else if constexpr (std::is_base_of_v<BaseExpression, T>) {
    // This is an expression type
    RulesBehavior::expressionLoaders.push_back({
        entt::hashed_string(name),
        [](ExpressionRef &expr, RulesBehavior &rulesBehavior, Reader &reader) {
          // Initialize a new expression, read params and return
          auto expression = (T *)rulesBehavior.pool.Malloc(sizeof(T));
          expr.maybeExpression = expression;
          new (expression) T();
          rulesBehavior.expressions.emplace_back(expression);
          reader.obj("params", [&]() {
            // Reflect on `params`
            if constexpr (Props::hasProps<typename T::Params>) {
              reader.each([&](const char *key) {
                const auto keyHash = entt::hashed_string(key).value();
                Props::forEach(expression->params, [&](auto &prop) {
                  using Prop = std::remove_reference_t<decltype(prop)>;
                  constexpr auto propNameHash = Prop::nameHash; // Ensure compile-time constants
                  constexpr auto propName = Prop::name;
                  if (keyHash == propNameHash && key == propName) {
                    if constexpr (std::is_same_v<ExpressionRef,
                                      std::remove_reference_t<decltype(prop())>>) {
                      // Child expression
                      rulesBehavior.readExpression(prop(), reader);
                    } else {
                      // Regular prop
                      reader.read(prop());
                    }
                  }
                });
              });
            }
          });
        },
    });
  }
}
