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
      if (auto nTaggedActorIds = taggedActorIds.size(); nTaggedActorIds == 0) {
        return nullActor;
      } else if (nTaggedActorIds == 1) {
        // Only one actor with this tag -- avoid extra logic and just return it
        return taggedActorIds.data()[0];
      } else {
        // Multiple actors with this tag
        auto &bodyBehavior = scene.getBehaviors().byType<BodyBehavior>();
        if (auto body = bodyBehavior.maybeGetPhysicsBody(ctx.actorId)) {
          // Current actor has a body -- return closest with tag
          auto pos = body->GetPosition();
          ActorId closestActorId = nullActor;
          auto closestSqDist = std::numeric_limits<float>::max();
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
        } else {
          // Current actor doesn't have a body -- return first actor with tag
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
    PROP(ActorRef, actorRef);
  } params;

  // Cache the call to `.getProperty` so we don't have to do the lookup by `behaviorId` every time
  // this expression is evaluated

  ExpressionValue (*cache)(RuleContext &, ActorId, PropId) = nullptr;

  ExpressionValue eval(RuleContext &ctx) override {
    if (!cache) {
      ctx.getScene().getBehaviors().byId(params.behaviorId(), [&](auto &behavior) {
        using Behavior = std::remove_reference_t<decltype(behavior)>;
        cache = [](RuleContext &ctx, ActorId actorId, PropId propId) {
          auto &behavior = ctx.getScene().getBehaviors().byType<Behavior>();
          return behavior.getProperty(actorId, propId);
        };
      });
    }
    if (cache) {
      return cache(ctx, params.actorRef().eval(ctx), params.propertyName());
    } else {
      return {};
    }
  }
};
