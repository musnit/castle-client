#include "behaviors/rules.h"


// Expressions whose results depend on scene state

struct TimeExpression : BaseExpression {
  inline static const RuleRegistration<TimeExpression> registration { "time" };

  struct Params {
  } params;

  ExpressionValue eval(RuleContext &ctx) override {
    return ctx.getScene().getPerformTime();
  }
};
