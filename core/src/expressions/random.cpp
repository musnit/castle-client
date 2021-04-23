#include "behaviors/rules.h"

#include <modules/math/MathModule.h>


// Expressions whose results involve random choices

struct RandomExpression : BaseExpression {
  inline static const RuleRegistration<RandomExpression> registration { "random" };

  struct Params {
    PROP(ExpressionRef, min) = 0;
    PROP(ExpressionRef, max) = 1;
    PROP(bool, discrete) = false;
  } params;

  ExpressionValue eval(RuleContext &ctx) override {
    auto min = params.min().eval<double>(ctx);
    auto max = params.max().eval<double>(ctx);
    if (params.discrete()) {
      return std::floor(ctx.getScene().getRNG().random(min, max + 1));
    } else {
      return ctx.getScene().getRNG().random(min, max);
    }
  }
};

struct PerlinExpression : BaseExpression {
  inline static const RuleRegistration<PerlinExpression> registration { "perlin" };

  struct Params {
    PROP(ExpressionRef, x) = 0;
    PROP(ExpressionRef, y) = 0;
  } params;

  ExpressionValue eval(RuleContext &ctx) override {
    return love::math::noise2(params.x().eval<double>(ctx), params.y().eval<double>(ctx));
  }
};

struct GaussExpression : BaseExpression {
  inline static const RuleRegistration<GaussExpression> registration { "gauss" };

  struct Params {
    PROP(ExpressionRef, mean) = 0;
    PROP(ExpressionRef, sigma) = 0;
  } params;

  ExpressionValue eval(RuleContext &ctx) override {
    auto mean = params.mean().eval<double>(ctx);
    auto sigma = params.sigma().eval<double>(ctx);
    return mean + ctx.getScene().getRNG().randomNormal(sigma);
  }
};

struct ChooseExpression : BaseExpression {
  inline static const RuleRegistration<ChooseExpression> registration { "choose" };

  struct Params {
    PROP(ExpressionRef, lhs) = 0;
    PROP(ExpressionRef, rhs) = 1;
  } params;

  ExpressionValue eval(RuleContext &ctx) override {
    auto lhs = params.lhs().eval<double>(ctx);
    auto rhs = params.rhs().eval<double>(ctx);
    return ctx.getScene().getRNG().random() < 0.5 ? lhs : rhs;
  }
};

struct WeightedChooseExpression : BaseExpression {
  inline static const RuleRegistration<WeightedChooseExpression> registration { "weighted choose" };

  struct Params {
    PROP(ExpressionRef, lhs) = 0;
    PROP(ExpressionRef, rhs) = 1;
    PROP(ExpressionRef, lhw) = 0.5;
    PROP(ExpressionRef, rhw) = 0.5;
  } params;

  ExpressionValue eval(RuleContext &ctx) override {
    auto lhs = params.lhs().eval<double>(ctx);
    auto rhs = params.rhs().eval<double>(ctx);
    auto lhw = params.lhw().eval<double>(ctx);
    auto rhw = params.rhw().eval<double>(ctx);
    if (lhw <= 0) {
      return rhs;
    }
    if (rhw <= 0) {
      return lhs;
    }
    return ctx.getScene().getRNG().random() < lhw / (lhw + rhw) ? lhs : rhs;
  }
};
