#include "behaviors/rules.h"


struct AddExpression : BaseExpression {
  // Defined in this file so we can use it in `readExpression` below

  inline static const RuleRegistration<AddExpression> registration { "+" };

  struct Params {
    PROP(ExpressionRef, lhs); // = 0;
    PROP(ExpressionRef, rhs); // = 0;
  } params;

  ExpressionValue evaluate(RuleContext &ctx) override {
    return ExpressionValue(eval<double>(params.lhs(), ctx) + eval<double>(params.rhs(), ctx));
  }
};
