#pragma once

#include "precomp.h"

#include "behaviors/base.h"
#include "props.h"


struct CounterComponent : BaseComponent {
  struct Props {
    PROP(
         double, value,
         .label("Value")
         .rulesSet(false)
         ) = 0;
    PROP(
         double, minValue,
         .label("minimum value")
         .rulesGet(false)
         .rulesSet(false)
         ) = 0;
    PROP(
         double, maxValue,
         .label("maximum value")
         .rulesGet(false)
         .rulesSet(false)
         ) = 100;
  } props;
};

class CounterBehavior : public BaseBehavior<CounterBehavior, CounterComponent> {
public:
  static constexpr auto name = "Counter";
  static constexpr auto behaviorId = 18;
  static constexpr auto displayName = "Counter";

  using BaseBehavior::BaseBehavior;


  void handleSetProperty(
      ActorId actorId, CounterComponent &component, PropId propId, const ExpressionValue &value);


  friend struct CounterValueExpression;
  friend struct SetCounterResponse;
  friend struct CounterMeetsConditionResponse;
};
