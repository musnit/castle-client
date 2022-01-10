#include "expression.h"
#include "behaviors/all.h"

void ExpressionRegistrar::registerClockExpressions() {
}


// Expressions whose results depend on the clock

// time since last beat

struct BeatsSinceClockStartedExpression : BaseExpression {
  inline static const RuleRegistration<BeatsSinceClockStartedExpression> registration {
    "beats elapsed"
  };
  static constexpr auto description = "Beats elapsed since the card started";

  struct Params {
  } params;

  ExpressionValue eval(RuleContext &ctx) override {
    auto &clock = ctx.getScene().getClock();
    return double(clock.getTotalBeatsElapsed() + 1);
  }
};

struct CurrentBeatInBarExpression : BaseExpression {
  inline static const RuleRegistration<CurrentBeatInBarExpression> registration {
    "current beat in bar"
  };
  static constexpr auto description = "The current beat in the current bar";

  struct Params {
  } params;

  ExpressionValue eval(RuleContext &ctx) override {
    auto &clock = ctx.getScene().getClock();
    return double(clock.getBeatIndexInBar() + 1);
  }
};

struct CurrentBarExpression : BaseExpression {
  inline static const RuleRegistration<CurrentBarExpression> registration { "current bar" };
  static constexpr auto description = "The current bar";

  struct Params {
  } params;

  ExpressionValue eval(RuleContext &ctx) override {
    auto &clock = ctx.getScene().getClock();
    return double(clock.getTotalBarsElapsed() + 1);
  }
};

struct TimeSinceLastBeatExpression : BaseExpression {
  inline static const RuleRegistration<TimeSinceLastBeatExpression> registration {
    "time since last beat"
  };
  static constexpr auto description = "Time since the last beat";

  struct Params {
  } params;

  ExpressionValue eval(RuleContext &ctx) override {
    auto &clock = ctx.getScene().getClock();
    return double(clock.getPerformTimeSinceBeat());
  }
};

struct ClockTempoExpression : BaseExpression {
  inline static const RuleRegistration<ClockTempoExpression> registration { "clock tempo" };
  static constexpr auto description = "The clock tempo";

  struct Params {
  } params;

  ExpressionValue eval(RuleContext &ctx) override {
    return double(ctx.getScene().getClock().getTempo());
  }
};
