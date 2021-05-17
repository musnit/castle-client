#include "counter.h"

#include "behaviors/all.h"


//
// Triggers
//

struct CounterChangesTrigger : BaseTrigger {
  inline static const RuleRegistration<CounterChangesTrigger, CounterBehavior> registration {
    "counter changes"
  };

  struct Params {
  } params;
};

struct CounterReachesValueTrigger : BaseTrigger {
  inline static const RuleRegistration<CounterReachesValueTrigger, CounterBehavior> registration {
    "counter reaches value"
  };

  struct Params {
    PROP(std::string, comparison) = "equal";
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

  struct Params {
    PROP(ExpressionRef, setToValue) = 0;
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
            return newExprValue.compare(trigger.params.comparison(), trigger.params.value());
          });
    }
  }
};

struct CounterMeetsConditionResponse : BaseResponse {
  inline static const RuleRegistration<CounterMeetsConditionResponse, CounterBehavior>
      registration { "counter meets condition" };

  struct Params {
    PROP(std::string, comparison);
    PROP(ExpressionRef, value);
  } params;

  bool eval(RuleContext &ctx) override {
    auto value = params.value().eval(ctx);
    auto &counterBehavior = ctx.getScene().getBehaviors().byType<CounterBehavior>();
    if (auto component = counterBehavior.maybeGetComponent(ctx.actorId)) {
      return ExpressionValue(component->props.value()).compare(params.comparison(), value);
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
