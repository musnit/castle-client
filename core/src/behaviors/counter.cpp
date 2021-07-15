#include "counter.h"

#include "behaviors/all.h"


//
// Triggers
//

struct CounterChangesTrigger : BaseTrigger {
  inline static const RuleRegistration<CounterChangesTrigger, CounterBehavior> registration {
    "counter changes"
  };
  static constexpr auto description = "When the actor's counter changes";

  struct Params {
  } params;
};

struct CounterReachesValueTrigger : BaseTrigger {
  inline static const RuleRegistration<CounterReachesValueTrigger, CounterBehavior> registration {
    "counter reaches value"
  };
  static constexpr auto description = "When this actor's counter reaches a value";

  struct Params {
    PROP(ExpressionComparison, comparison);
    PROP(double, value) = 0;
  } params;
};


//
// Responses
//

struct SetCounterResponse : BaseResponse {
  inline static const RuleRegistration<SetCounterResponse, CounterBehavior> registration {
    "set counter"
  };
  static constexpr auto description = "Modify the actor's counter";

  struct Params {
    PROP(ExpressionRef, setToValue, .label("set to value")) = 0;
    PROP(bool, relative) = false;
  } params;

  void run(RuleContext &ctx) override {
    auto actorId = ctx.actorId;
    auto &scene = ctx.getScene();
    auto &counterBehavior = scene.getBehaviors().byType<CounterBehavior>();
    auto value = params.setToValue().eval(ctx).as<double>();
    if (auto component = counterBehavior.maybeGetComponent(actorId)) {
      // Update value
      auto &props = component->props;
      auto newValue = params.relative() ? props.value() + value : value;
      newValue = std::clamp(newValue, props.minValue(), props.maxValue());
      props.value() = newValue;

      // Fire triggers
      auto newExprValue = ExpressionValue(newValue);
      auto &rulesBehavior = scene.getBehaviors().byType<RulesBehavior>();
      rulesBehavior.fire<CounterChangesTrigger>(actorId, {});
      rulesBehavior.fireIf<CounterReachesValueTrigger>(
          actorId, {}, [&](const CounterReachesValueTrigger &trigger) {
            return trigger.params.comparison().compare(newExprValue, trigger.params.value());
          });
    }
  }
};

struct CounterMeetsConditionResponse : BaseResponse {
  inline static const RuleRegistration<CounterMeetsConditionResponse, CounterBehavior>
      registration { "counter meets condition" };
  static constexpr auto description = "If the actor's counter meets a condition";

  struct Params {
    PROP(ExpressionComparison, comparison);
    PROP(ExpressionRef, value);
  } params;

  bool eval(RuleContext &ctx) override {
    auto value = params.value().eval(ctx);
    auto &counterBehavior = ctx.getScene().getBehaviors().byType<CounterBehavior>();
    if (auto component = counterBehavior.maybeGetComponent(ctx.actorId)) {
      return params.comparison().compare(ExpressionValue(component->props.value()), value);
    }
    return false;
  }
};


//
// Getters, setters
//

void CounterBehavior::handleSetProperty(
    ActorId actorId, CounterComponent &component, PropId propId, const ExpressionValue &value) {
  auto &props = component.props;
  if (propId == props.value.id) {
    props.value() = std::clamp(value.as<double>(), props.minValue(), props.maxValue());
  } else {
    BaseBehavior::handleSetProperty(actorId, component, propId, value);
  }
}
