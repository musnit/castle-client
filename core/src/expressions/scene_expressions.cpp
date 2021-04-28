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

  ActorId eval(RuleContext &ctx) {
    switch (kind()[0]) {
    case 's': { // "self"
      return ctx.actorId;
    }
    case 'c': { // "closest"
      auto &scene = ctx.getScene();
      auto &tagsBehavior = scene.getBehaviors().byType<TagsBehavior>();
      auto &taggedActorIds = tagsBehavior.getActors(tag());
      auto &bodyBehavior = scene.getBehaviors().byType<BodyBehavior>();
      if (auto body = bodyBehavior.maybeGetPhysicsBody(ctx.actorId)) {
        // Current actor has a body -- return closest with tag
        auto nTaggedActorIds = taggedActorIds.size();
        if (nTaggedActorIds == 0) {
          return nullActor;
        } else if (nTaggedActorIds == 1) { // Avoid math in common singleton scenario
          return taggedActorIds.data()[0];
        } else {
          auto pos = body->GetPosition();
          ActorId closestActorId = nullActor;
          float closestSqDist = std::numeric_limits<float>::max();
          for (auto taggedActorId : taggedActorIds) {
            if (auto taggedBody = bodyBehavior.maybeGetPhysicsBody(taggedActorId)) {
              // Has a body -- check if closer
              auto sqDist = (taggedBody->GetPosition() - pos).LengthSquared();
              if (sqDist < closestSqDist) {
                closestActorId = taggedActorId;
                closestSqDist = sqDist;
              }
            } else {
              // Doesn't have a body -- assume it's at infinity
              if (closestSqDist == std::numeric_limits<float>::max()) {
                closestActorId = taggedActorId;
              }
            }
          }
          return closestActorId;
        }
      } else {
        // Current actor doesn't have a body -- return first actor with tag
        if (!taggedActorIds.empty()) {
          return taggedActorIds.data()[0];
        }
      }
    }
    case 'o': { // "other"
    }
    }
    return nullActor;
  }
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
    auto actorId = params.actorRef().eval(ctx);
    if (actorId == nullActor) {
      return {};
    }
    auto propId = params.propertyName();
    ExpressionValue result;
    ctx.getScene().getBehaviors().byId(params.behaviorId(), [&](auto &behavior) {
      // Keep the body of this lambda small for better codegen
      result = behavior.getProperty(actorId, propId);
    });
    return result;
  }
};
