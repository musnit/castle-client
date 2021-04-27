#include "behaviors/all.h"


// Expressions whose results depend on scene state

struct TimeExpression : BaseExpression {
  inline static const RuleRegistration<TimeExpression> registration { "time" };

  struct Params {
  } params;

  ExpressionValue eval(RuleContext &ctx) override {
    return ctx.getScene().getPerformTime();
  }
};

struct NumberOfActorsExpression : BaseExpression {
  inline static const RuleRegistration<NumberOfActorsExpression> registration {
    "number of actors"
  };

  struct Params {
    PROP(Tag, tag);
  } params;

  ExpressionValue eval(RuleContext &ctx) override {
    auto &tagsBehavior = ctx.getScene().getBehaviors().byType<TagsBehavior>();
    return tagsBehavior.getActors(params.tag()).size();
  }
};

struct ActorRef {
  PROP(std::string, kind) = "self";
  PROP(Tag, tag);
};

struct BehaviorPropertyExpression : BaseExpression {
  inline static const RuleRegistration<BehaviorPropertyExpression> registration {
    "behavior property"
  };

  struct Params {
    PROP(int, behaviorId) = -1;
    PROP(PropId, propertyName);
    PROP(ActorRef, actorRef); // TODO(nikki): Actually use `actorRef`
  } params;

  ExpressionValue eval(RuleContext &ctx) override {
    auto actorId = ctx.actorId; // Codegen turns out better if we compute these outside the lambda
    auto propId = params.propertyName();
    ExpressionValue result;
    ctx.getScene().getBehaviors().byId(params.behaviorId(), [&](auto &behavior) {
      result = behavior.getProperty(actorId, propId);
    });
    return result;
  }
};
