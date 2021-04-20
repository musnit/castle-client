#include "behaviors/rules.h"


struct AddExpression : BaseExpression {
  inline static const RuleRegistration<AddExpression> registration { "+" };

  struct Params {
    PROP(ExpressionRef, lhs);
    PROP(ExpressionRef, rhs);
  } params;

  ExpressionValue eval(RuleContext &ctx) override {
    return params.lhs().eval<double>(ctx) + params.rhs().eval<double>(ctx);
  }
};
