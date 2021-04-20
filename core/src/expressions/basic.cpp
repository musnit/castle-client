#include "behaviors/rules.h"


struct NumberExpression : BaseExpression {
  inline static const RuleRegistration<NumberExpression> registration { "number" };

  struct Params {
    PROP(double, value) = 0;
  } params;

  ExpressionValue eval(RuleContext &ctx) override {
    return params.value();
  }
};
