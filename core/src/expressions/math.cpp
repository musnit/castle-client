#include "behaviors/rules.h"


// Math expressions whose results are 'pure' functions of inputs -- i.e., no randomness or
// dependence on scene state

struct NumberExpression : BaseExpression {
  inline static const RuleRegistration<NumberExpression> registration { "number" };

  struct Params {
    PROP(double, value) = 0;
  } params;

  ExpressionValue eval(RuleContext &ctx) override {
    return params.value();
  }
};

struct AddExpression : BaseExpression {
  inline static const RuleRegistration<AddExpression> registration { "+" };

  struct Params {
    PROP(ExpressionRef, lhs) = 0;
    PROP(ExpressionRef, rhs) = 0;
  } params;

  ExpressionValue eval(RuleContext &ctx) override {
    return params.lhs().eval<double>(ctx) + params.rhs().eval<double>(ctx);
  }
};

struct SubtractExpression : BaseExpression {
  inline static const RuleRegistration<SubtractExpression> registration { "-" };

  struct Params {
    PROP(ExpressionRef, lhs) = 0;
    PROP(ExpressionRef, rhs) = 0;
  } params;

  ExpressionValue eval(RuleContext &ctx) override {
    return params.lhs().eval<double>(ctx) - params.rhs().eval<double>(ctx);
  }
};

struct MultiplyExpression : BaseExpression {
  inline static const RuleRegistration<MultiplyExpression> registration { "*" };

  struct Params {
    PROP(ExpressionRef, lhs) = 1;
    PROP(ExpressionRef, rhs) = 1;
  } params;

  ExpressionValue eval(RuleContext &ctx) override {
    return params.lhs().eval<double>(ctx) * params.rhs().eval<double>(ctx);
  }
};

struct DivideExpression : BaseExpression {
  inline static const RuleRegistration<DivideExpression> registration { "/" };

  struct Params {
    PROP(ExpressionRef, lhs) = 1;
    PROP(ExpressionRef, rhs) = 1;
  } params;

  ExpressionValue eval(RuleContext &ctx) override {
    auto lhs = params.lhs().eval<double>(ctx);
    auto rhs = params.rhs().eval<double>(ctx);
    return rhs != 0 ? lhs / rhs : 0;
  }
};

struct ModExpression : BaseExpression {
  inline static const RuleRegistration<ModExpression> registration { "%" };

  struct Params {
    PROP(ExpressionRef, lhs) = 1;
    PROP(ExpressionRef, rhs) = 1;
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

  struct Params {
    PROP(ExpressionRef, lhs) = 1;
    PROP(ExpressionRef, rhs) = 1;
  } params;

  ExpressionValue eval(RuleContext &ctx) override {
    return std::pow(params.lhs().eval<double>(ctx), params.rhs().eval<double>(ctx));
  }
};

struct LogExpression : BaseExpression {
  inline static const RuleRegistration<LogExpression> registration { "log" };

  struct Params {
    PROP(ExpressionRef, base) = 2;
    PROP(ExpressionRef, number) = 1;
  } params;

  ExpressionValue eval(RuleContext &ctx) override {
    auto number = params.number().eval<double>(ctx);
    auto logBase = std::log(params.base().eval<double>(ctx));
    return logBase != 0 ? std::log(number) / logBase : 0;
  }
};

struct AbsExpression : BaseExpression {
  inline static const RuleRegistration<AbsExpression> registration { "abs" };

  struct Params {
    PROP(ExpressionRef, number) = 0;
  } params;

  ExpressionValue eval(RuleContext &ctx) override {
    return std::abs(params.number().eval<double>(ctx));
  }
};

struct FloorExpression : BaseExpression {
  inline static const RuleRegistration<FloorExpression> registration { "floor" };

  struct Params {
    PROP(ExpressionRef, number) = 0;
  } params;

  ExpressionValue eval(RuleContext &ctx) override {
    return std::floor(params.number().eval<double>(ctx));
  }
};

struct MixExpression : BaseExpression {
  inline static const RuleRegistration<MixExpression> registration { "mix" };

  struct Params {
    PROP(ExpressionRef, lhs) = 0;
    PROP(ExpressionRef, rhs) = 1;
    PROP(ExpressionRef, mix) = 0.5;
  } params;

  ExpressionValue eval(RuleContext &ctx) override {
    auto mix = params.mix().eval<double>(ctx);
    return (1 - mix) * params.lhs().eval<double>(ctx) + mix * params.rhs().eval<double>(ctx);
  }
};

struct ClampExpression : BaseExpression {
  inline static const RuleRegistration<ClampExpression> registration { "clamp" };

  struct Params {
    PROP(ExpressionRef, number) = 0;
    PROP(ExpressionRef, min) = 0;
    PROP(ExpressionRef, max) = 1;
  } params;

  ExpressionValue eval(RuleContext &ctx) override {
    auto number = params.number().eval<double>(ctx);
    auto min = params.min().eval<double>(ctx);
    auto max = params.max().eval<double>(ctx);
    return std::clamp(min, number, max);
  }
};

struct SinExpression : BaseExpression {
  inline static const RuleRegistration<SinExpression> registration { "sin" };

  struct Params {
    PROP(ExpressionRef, number) = 0;
  } params;

  ExpressionValue eval(RuleContext &ctx) override {
    return std::sin(params.number().eval<double>(ctx));
  }
};

struct RadExpression : BaseExpression {
  inline static const RuleRegistration<RadExpression> registration { "rad" };

  struct Params {
    PROP(ExpressionRef, number) = 0;
  } params;

  ExpressionValue eval(RuleContext &ctx) override {
    return M_PI * params.number().eval<double>(ctx) / 180;
  }
};

struct MinExpression : BaseExpression {
  inline static const RuleRegistration<MinExpression> registration { "min" };

  struct Params {
    PROP(ExpressionRef, lhs) = 0;
    PROP(ExpressionRef, rhs) = 1;
  } params;

  ExpressionValue eval(RuleContext &ctx) override {
    return std::min(params.lhs().eval<double>(ctx), params.rhs().eval<double>(ctx));
  }
};

struct MaxExpression : BaseExpression {
  inline static const RuleRegistration<MaxExpression> registration { "max" };

  struct Params {
    PROP(ExpressionRef, lhs) = 0;
    PROP(ExpressionRef, rhs) = 1;
  } params;

  ExpressionValue eval(RuleContext &ctx) override {
    return std::max(params.lhs().eval<double>(ctx), params.rhs().eval<double>(ctx));
  }
};
