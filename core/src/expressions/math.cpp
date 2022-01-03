#include "expression.h"
#include "behaviors/rules.h"

void ExpressionRegistrar::registerMathExpressions() {
}


// Math expressions whose results are 'pure' functions of inputs -- i.e., no randomness or
// dependence on scene state

struct NumberExpression : BaseExpression {
  inline static const RuleRegistration<NumberExpression> registration { "number" };
  static constexpr auto description = "a constant number";

  struct Params {
    PROP(double, value) = 0;
  } params;

  ExpressionValue eval(RuleContext &ctx) override {
    return params.value();
  }
};

struct AddExpression : BaseExpression {
  inline static const RuleRegistration<AddExpression> registration { "+" };
  static constexpr auto description = "add";

  struct Params {
    PROP(ExpressionRef, lhs, .label("Left operand")) = 0;
    PROP(ExpressionRef, rhs, .label("Right operand")) = 0;
  } params;

  ExpressionValue eval(RuleContext &ctx) override {
    return params.lhs().eval<double>(ctx) + params.rhs().eval<double>(ctx);
  }
};

struct SubtractExpression : BaseExpression {
  inline static const RuleRegistration<SubtractExpression> registration { "-" };
  static constexpr auto description = "subtract";

  struct Params {
    PROP(ExpressionRef, lhs, .label("Left operand")) = 0;
    PROP(ExpressionRef, rhs, .label("Right operand")) = 0;
  } params;

  ExpressionValue eval(RuleContext &ctx) override {
    return params.lhs().eval<double>(ctx) - params.rhs().eval<double>(ctx);
  }
};

struct MultiplyExpression : BaseExpression {
  inline static const RuleRegistration<MultiplyExpression> registration { "*" };
  static constexpr auto description = "multiply";

  struct Params {
    PROP(ExpressionRef, lhs, .label("Left operand")) = 1;
    PROP(ExpressionRef, rhs, .label("Right operand")) = 1;
  } params;

  ExpressionValue eval(RuleContext &ctx) override {
    return params.lhs().eval<double>(ctx) * params.rhs().eval<double>(ctx);
  }
};

struct DivideExpression : BaseExpression {
  inline static const RuleRegistration<DivideExpression> registration { "/" };
  static constexpr auto description = "divide";

  struct Params {
    PROP(ExpressionRef, lhs, .label("Numerator")) = 1;
    PROP(ExpressionRef, rhs, .label("Denominator")) = 1;
  } params;

  ExpressionValue eval(RuleContext &ctx) override {
    auto lhs = params.lhs().eval<double>(ctx);
    auto rhs = params.rhs().eval<double>(ctx);
    return rhs != 0 ? lhs / rhs : 0;
  }
};

struct ModExpression : BaseExpression {
  inline static const RuleRegistration<ModExpression> registration { "%" };
  static constexpr auto description = "modulo";

  struct Params {
    PROP(ExpressionRef, lhs, .label("Left operand")) = 1;
    PROP(ExpressionRef, rhs, .label("Right operand")) = 1;
  } params;

  ExpressionValue eval(RuleContext &ctx) override {
    // Match Lua's `%` -- https://www.lua.org/manual/5.1/manual.html#2.5.1
    auto lhs = params.lhs().eval<double>(ctx);
    auto rhs = params.rhs().eval<double>(ctx);
    return rhs != 0 ? lhs - std::floor(lhs / rhs) * rhs : 0;
  }
};

struct PowExpression : BaseExpression {
  inline static const RuleRegistration<PowExpression> registration { "^" };
  static constexpr auto description = "power";

  struct Params {
    PROP(ExpressionRef, lhs, .label("Base")) = 1;
    PROP(ExpressionRef, rhs, .label("Exponent")) = 1;
  } params;

  ExpressionValue eval(RuleContext &ctx) override {
    return std::pow(params.lhs().eval<double>(ctx), params.rhs().eval<double>(ctx));
  }
};

struct LogExpression : BaseExpression {
  inline static const RuleRegistration<LogExpression> registration { "log" };
  static constexpr auto description = "logarithm";

  struct Params {
    PROP(ExpressionRef, base, .label("Base")) = 2;
    PROP(ExpressionRef, number, .label("Number")) = 1;
  } params;

  ExpressionValue eval(RuleContext &ctx) override {
    auto number = params.number().eval<double>(ctx);
    auto logBase = std::log(params.base().eval<double>(ctx));
    return logBase != 0 ? std::log(number) / logBase : 0;
  }
};

struct AbsExpression : BaseExpression {
  inline static const RuleRegistration<AbsExpression> registration { "abs" };
  static constexpr auto description = "absolute value";

  struct Params {
    PROP(ExpressionRef, number) = 0;
  } params;

  ExpressionValue eval(RuleContext &ctx) override {
    return std::abs(params.number().eval<double>(ctx));
  }
};

struct FloorExpression : BaseExpression {
  inline static const RuleRegistration<FloorExpression> registration { "floor" };
  static constexpr auto description = "round down";

  struct Params {
    PROP(ExpressionRef, number) = 0;
  } params;

  ExpressionValue eval(RuleContext &ctx) override {
    return std::floor(params.number().eval<double>(ctx));
  }
};

struct RoundExpression : BaseExpression {
  inline static const RuleRegistration<RoundExpression> registration { "round" };
  static constexpr auto description = "round";

  struct Params {
    PROP(ExpressionRef, number) = 0;
  } params;

  ExpressionValue eval(RuleContext &ctx) override {
    return std::round(params.number().eval<double>(ctx));
  }
};

struct MixExpression : BaseExpression {
  inline static const RuleRegistration<MixExpression> registration { "mix" };
  static constexpr auto description = "mix two values";

  struct Params {
    PROP(ExpressionRef, lhs, .label("First input")) = 0;
    PROP(ExpressionRef, rhs, .label("Second input")) = 1;
    PROP(
         ExpressionRef, mix,
         .label("Mix")
         .min(0)
         .max(1)
         ) = 0.5;
  } params;

  ExpressionValue eval(RuleContext &ctx) override {
    auto mix = params.mix().eval<double>(ctx);
    return (1 - mix) * params.lhs().eval<double>(ctx) + mix * params.rhs().eval<double>(ctx);
  }
};

struct ClampExpression : BaseExpression {
  inline static const RuleRegistration<ClampExpression> registration { "clamp" };
  static constexpr auto description = "clamp a value between two bounds";

  struct Params {
    PROP(ExpressionRef, number, .label("Value to clamp")) = 0;
    PROP(ExpressionRef, min, .label("Minimum value")) = 0;
    PROP(ExpressionRef, max, .label("Maximum value")) = 1;
  } params;

  ExpressionValue eval(RuleContext &ctx) override {
    auto number = params.number().eval<double>(ctx);
    auto min = params.min().eval<double>(ctx);
    auto max = params.max().eval<double>(ctx);
    return std::clamp(number, min, max);
  }
};

struct SinExpression : BaseExpression {
  inline static const RuleRegistration<SinExpression> registration { "sin" };
  static constexpr auto description = "sine";

  struct Params {
    PROP(ExpressionRef, number, .label("Number (radians)")) = 0;
  } params;

  ExpressionValue eval(RuleContext &ctx) override {
    return std::sin(params.number().eval<double>(ctx));
  }
};

struct RadExpression : BaseExpression {
  inline static const RuleRegistration<RadExpression> registration { "rad" };
  static constexpr auto description = "Degrees to radians";

  struct Params {
    PROP(ExpressionRef, number, .label("Degrees")) = 0;
  } params;

  ExpressionValue eval(RuleContext &ctx) override {
    return M_PI * params.number().eval<double>(ctx) / 180;
  }
};

struct MinExpression : BaseExpression {
  inline static const RuleRegistration<MinExpression> registration { "min" };
  static constexpr auto description = "minimum";

  struct Params {
    PROP(ExpressionRef, lhs, .label("First input")) = 0;
    PROP(ExpressionRef, rhs, .label("Second input")) = 1;
  } params;

  ExpressionValue eval(RuleContext &ctx) override {
    return std::min(params.lhs().eval<double>(ctx), params.rhs().eval<double>(ctx));
  }
};

struct MaxExpression : BaseExpression {
  inline static const RuleRegistration<MaxExpression> registration { "max" };
  static constexpr auto description = "maximum";

  struct Params {
    PROP(ExpressionRef, lhs, .label("First input")) = 0;
    PROP(ExpressionRef, rhs, .label("Second input")) = 1;
  } params;

  ExpressionValue eval(RuleContext &ctx) override {
    return std::max(params.lhs().eval<double>(ctx), params.rhs().eval<double>(ctx));
  }
};
