#include "counter.h"

#include "behaviors/all.h"


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
    auto &counterBehavior = ctx.getScene().getBehaviors().byType<CounterBehavior>();
    auto value = params.setToValue().eval(ctx).as<double>();
    if (auto component = counterBehavior.maybeGetComponent(ctx.actorId)) {
      component->props.value()
          = std::clamp(component->props.minValue(), value, component->props.maxValue());
    }
  }
};


//
// Getters, setters
//

void CounterBehavior::handleSetProperty(
    ActorId actorId, CounterComponent &component, PropId propId, const ExpressionValue &value) {
  auto &props = component.props;
  if (propId == props.value.id) {
    props.value() = std::clamp(props.minValue(), value.as<double>(), props.maxValue());
  } else {
    BaseBehavior::handleSetProperty(actorId, component, propId, value);
  }
}
