#include "rules.h"

#include "behaviors/all.h"
#include "engine.h"
#include "sound/sample.h"
#include "api.h"

//
// Serialization
//

void ExpressionRef::write(Writer &writer) const {
  // for now assume constant
  // TODO: eval `maybeExpression`
  if (constant.is<double>()) {
    writer.num("value", constant.as<double>());
  } else {
    writer.str("value", constant.as<const char *>());
  }
}

void BaseResponse::write(Writer &writer) const {
  // don't actually serialize responses here. Needed for ParamSpecs which refer to Responses
  writer.obj("body", [&]() {
  });
}

//
// Lifecycle triggers
//

struct CreateTrigger : BaseTrigger {
  inline static const RuleRegistration<CreateTrigger, RulesBehavior> registration { "create" };
  static constexpr auto description = "When this is created";

  struct Params {
  } params;
};

struct DestroyTrigger : BaseTrigger {
  inline static const RuleRegistration<DestroyTrigger, RulesBehavior> registration { "destroy" };
  static constexpr auto description = "When this is destroyed";

  struct Params {
  } params;
};


//
// Lifecycle responses
//

struct CreateResponse : BaseResponse {
  inline static const RuleRegistration<CreateResponse, RulesBehavior> registration { "create" };
  static constexpr auto description = "Create a new actor from blueprint";

  struct Params {
    PROP(
         std::string, entryId,
         .label("blueprint to create")
         );
    PROP(
         std::string, coordinateSystem,
         .label("coordinate system")
         .allowedValues("relative position", "relative angle and distance", "absolute position")
         )
            = "relative position";
    PROP(
         ExpressionRef, xOffset,
         .label("relative x position")
         ) = 0;
    PROP(
         ExpressionRef, yOffset,
         .label("relative y position")
         ) = 0;
    PROP(
         ExpressionRef, xAbsolute,
         .label("absolute x position")
         ) = 0;
    PROP(
         ExpressionRef, yAbsolute,
         .label("absolute y position")
         ) = 0;
    PROP(
         ExpressionRef, angle,
         .label("angle (degrees)")
         ) = 0;
    PROP(ExpressionRef, distance) = 0;
    PROP(
         std::string, depth,
         .allowedValues(
             "behind all actors",
             "behind this actor",
             "in front of this actor",
             "in front of all actors"
           )
         )
            = "in front of all actors";
  } params;

  void run(RuleContext &ctx) override {
    auto &scene = ctx.getScene();
    auto creatorActorId = ctx.actorId;

    // Start an `ActorDesc`
    Scene::ActorDesc newActorDesc;

    // Parent entry id
    if (auto &entryId = params.entryId(); entryId.empty()) {
      return;
    } else {
      newActorDesc.parentEntryId = entryId.c_str();
    }

    // Depth
    if (auto &depth = params.depth(); depth[0] == 'b') {
      if (depth[7] == 't') {
        // Behind this
        newActorDesc.drawOrderParams.relativeToActor = creatorActorId;
        newActorDesc.drawOrderParams.relativity = Scene::DrawOrderParams::Behind;
      } else {
        // Behind all
        newActorDesc.drawOrderParams.relativity = Scene::DrawOrderParams::BehindAll;
      }
    } else {
      if (depth[12] == 't') {
        // Front of this
        newActorDesc.drawOrderParams.relativeToActor = creatorActorId;
        newActorDesc.drawOrderParams.relativity = Scene::DrawOrderParams::FrontOf;
      } else {
        // Front of all
        newActorDesc.drawOrderParams.relativity = Scene::DrawOrderParams::FrontOfAll;
      }
    }

    // Add the actor and check if successful
    auto newActorId = scene.addActor(newActorDesc);
    if (newActorId == nullActor) {
      return;
    }

    // Set position
    auto &bodyBehavior = scene.getBehaviors().byType<BodyBehavior>();
    if (auto newBody = bodyBehavior.maybeGetPhysicsBody(newActorId)) {
      b2Vec2 newPos;
      auto &coordinateSystem = params.coordinateSystem();
      if (coordinateSystem[0] == 'r') { // Whether starts with "relative" or "absolute"
        // Relative
        auto creatorPos = ctx.lastPosition;
        auto creatorAngle = ctx.lastAngle;
        if (auto creatorBody = bodyBehavior.maybeGetPhysicsBody(creatorActorId)) {
          creatorPos = creatorBody->GetPosition();
          creatorAngle = creatorBody->GetAngle();
        }
        if (coordinateSystem[9] == 'p') { // Whether has "position" or "angle" in the middle
          // Relative position
          auto xOffset = params.xOffset().eval<float>(ctx);
          auto yOffset = params.yOffset().eval<float>(ctx);
          newPos = creatorPos + b2Vec2(xOffset, yOffset);
        } else {
          // Relative angle and distance
          auto angle = float(params.angle().eval<double>(ctx) * M_PI / 180) + creatorAngle;
          auto distance = params.distance().eval<float>(ctx);
          newPos = creatorPos + distance * b2Vec2(std::cos(angle), std::sin(angle));
        }
      } else {
        // Absolute
        auto xAbsolute = params.xAbsolute().eval<float>(ctx);
        auto yAbsolute = params.yAbsolute().eval<float>(ctx);
        newPos = { xAbsolute, yAbsolute };
      }
      bodyBehavior.setPosition(newActorId, newPos);
    }
  }
};

struct CreateTextResponse : BaseResponse {
  inline static const RuleRegistration<CreateTextResponse, RulesBehavior> registration {
    "create text"
  };
  static constexpr auto description = "Create a text box";

  struct Params {
    PROP(std::string, content);
    PROP(
         std::string, action,
         .label("When tapped")
         .allowedValues("none", "dismiss", "perform response")
         ) = "dismiss";
    PROP(ResponseRef, body) = nullptr;
  } params;

  void linearize(ResponseRef continuation) override {
    BaseResponse::linearize(next, continuation);
    BaseResponse::linearize(params.body(), nullptr);
  }

  void run(RuleContext &ctx) override {
    // Create blueprint of new text actor to add
    Archive archive;
    archive.write([&](Archive::Writer &writer) {
      writer.obj("components", [&]() {
        // Text component with content
        writer.obj("Text", [&]() {
          writer.str("content", params.content());
        });

        // Rules component with action
        writer.obj("Rules", [&]() {
          writer.arr("rules", [&]() {
            writer.obj([&]() {
              // Tap trigger
              writer.obj("trigger", [&]() {
                writer.str("name", "tap");
                writer.num("behaviorId", TextBehavior::behaviorId);
              });

              // Response
              writer.obj("response", [&]() {
                auto body = params.body();
                auto &rulesBehavior = ctx.getScene().getBehaviors().byType<RulesBehavior>();
                if (params.action()[0] == 'p' && body) {
                  // "perform response" body
                  writer.num("index", rulesBehavior.getResponseIndex(body));
                } else if (params.action()[0] == 'd') {
                  // "dismiss"
                  writer.num("index", rulesBehavior.getDestroyResponseIndex());
                }
              });
            });
          });
        });
      });
    });

    // Create actor from blueprint
    archive.read([&](Reader &reader) {
      Scene::ActorDesc newActorDesc;
      newActorDesc.reader = &reader;
      ctx.getScene().addActor(newActorDesc);
    });
  }
};

struct DestroyResponseMarker {
  // Added to an actor when a destroy response is run on it, marking an impending destruction. The
  // actor is destroyed at the end of the frame rather than right away, so that rule execution can
  // continue.
};

struct DestroyResponse : BaseResponse {
  inline static const RuleRegistration<DestroyResponse, RulesBehavior> registration { "destroy" };
  static constexpr auto description = "Destroy this actor";

  struct Params {
  } params;

  void run(RuleContext &ctx) override {
    auto &scene = ctx.getScene();
    auto actorId = ctx.actorId;
    if (scene.hasActor(actorId)) {
      auto &bodyBehavior = scene.getBehaviors().byType<BodyBehavior>();
      if (auto body = bodyBehavior.maybeGetPhysicsBody(actorId)) {
        ctx.lastPosition = body->GetPosition();
        ctx.lastAngle = body->GetAngle();
      }
      ctx.didDestroyOwningActor = true;
      scene.getEntityRegistry().emplace_or_replace<DestroyResponseMarker>(actorId);
    }
  }
};

struct HideTextResponse : BaseResponse {
  inline static const RuleRegistration<HideTextResponse, RulesBehavior> registration {
    "hide text"
  };
  static constexpr auto description = "Hide all text boxes";

  struct Params {
  } params;

  void run(RuleContext &ctx) override {
    auto &scene = ctx.getScene();
    scene.getBehaviors().byType<TextBehavior>().forEachComponent(
        [&](ActorId actorId, TextComponent &component) {
          component.props.visible() = false;
        });
  }
};


//
// Behavior responses
//

struct EnableBehaviorResponse : BaseResponse {
  inline static const RuleRegistration<EnableBehaviorResponse, RulesBehavior> registration {
    "enable behavior"
  };
  static constexpr auto description = "Enable a behavior";

  struct Params {
    PROP(int, behaviorId, .label("behavior")) = -1;
  } params;

  void run(RuleContext &ctx) override {
    ctx.getScene().getBehaviors().byId(params.behaviorId(), [&](auto &behavior) {
      behavior.enableComponent(ctx.actorId);
    });
  }
};

struct DisableBehaviorResponse : BaseResponse {
  inline static const RuleRegistration<DisableBehaviorResponse, RulesBehavior> registration {
    "disable behavior"
  };
  static constexpr auto description = "Disable a behavior";

  struct Params {
    PROP(int, behaviorId, .label("behavior")) = -1;
  } params;

  void run(RuleContext &ctx) override {
    ctx.getScene().getBehaviors().byId(params.behaviorId(), [&](auto &behavior) {
      behavior.disableComponent(ctx.actorId);
    });
  }
};

struct SetBehaviorPropertyResponse : BaseResponse {
  inline static const RuleRegistration<SetBehaviorPropertyResponse, RulesBehavior> registration {
    "set behavior property"
  };
  static constexpr auto description = "Modify a property";

  struct Params {
    PROP(int, behaviorId, .label("behavior")) = -1;
    PROP(
         PropId, propertyName,
         .label("parameter")
         );
    PROP(
         ExpressionRef, value,
         .label("set to")
         );
    PROP(bool, relative) = false;
  } params;

  // Cache the call to `.setProperty` so we don't have to do the lookup by `behaviorId` every time
  // this response is run

  void (*cache)(RuleContext &, ActorId, PropId, const ExpressionValue &, bool) = nullptr;

  void run(RuleContext &ctx) override {
    if (!cache) {
      ctx.getScene().getBehaviors().byId(params.behaviorId(), [&](auto &behavior) {
        using Behavior = std::remove_reference_t<decltype(behavior)>;
        cache = [](RuleContext &ctx, ActorId actorId, PropId propId, const ExpressionValue &value,
                    bool relative) {
          auto &behavior = ctx.getScene().getBehaviors().byType<Behavior>();
          behavior.setProperty(actorId, propId, value, relative);
        };
      });
    }
    if (cache) {
      cache(ctx, ctx.actorId, params.propertyName(), params.value().eval(ctx), params.relative());
    }
  }
};


//
// Scene responses
//

struct Card {
  Card() = default;

  void read(Reader &reader) {
    title = reader.str("title", "");
    cardId = reader.str("cardId", "");
    // JS_preloadCardId(cardId.c_str(), cardId.size());
  }

  std::string title;
  std::string cardId;
};

struct RulesSendPlayerToCardResponse : BaseResponse {
  inline static const RuleRegistration<RulesSendPlayerToCardResponse, RulesBehavior> registration {
    "send player to card"
  };
  static constexpr auto description = "Send player to a different card";

  struct Params {
    PROP(Card, card, .label("destination card"));
  } params;

  void run(RuleContext &ctx) override {
    ctx.getScene().setNextCardId(params.card().cardId);
  }
};

struct RestartSceneResponse : BaseResponse {
  inline static const RuleRegistration<RestartSceneResponse, RulesBehavior> registration {
    "restart scene"
  };
  static constexpr auto description = "Restart this card";

  struct Params {
  } params;

  void run(RuleContext &ctx) override {
    ctx.getScene().requestRestart();
  }
};


//
// Control flow responses
//

struct IfResponse : BaseResponse {
  inline static const RuleRegistration<IfResponse, RulesBehavior> registration { "if" };
  static constexpr auto description = "If a condition is met, run a response";

  struct Params {
    PROP(ResponseRef, condition) = nullptr;
    PROP(ResponseRef, then) = nullptr;
    PROP_NAMED("else", ResponseRef, else_) = nullptr;
  } params;

  void linearize(ResponseRef continuation) override {
    // Set `next` as the continuation after either branch. This ensures nested 'wait's in either
    // branch block outer responses, and also defaults either branch to `next` if empty.
    BaseResponse::linearize(next, continuation);
    BaseResponse::linearize(params.then(), next);
    BaseResponse::linearize(params.else_(), next);
  }

  void run(RuleContext &ctx) override {
    // Default to 'then' branch on non-existent condition
    if (auto condition = params.condition(); !condition || condition->eval(ctx)) {
      ctx.setNext(params.then());
    } else {
      ctx.setNext(params.else_());
    }
  }
};

struct RepeatResponse : BaseResponse {
  inline static const RuleRegistration<RepeatResponse, RulesBehavior> registration { "repeat" };
  static constexpr auto description = "Repeat N times";

  static constexpr auto maxCount = 5000;

  struct Params {
    PROP(
         ExpressionRef, count,
         .label("repetitions")
         .min(0)
         .max(maxCount)
         ) = 3;
    PROP(ResponseRef, body) = nullptr;
  } params;

  void linearize(ResponseRef continuation) override {
    // Set ourselves as the continuation after the body. This way execution will loop back around
    // to us after the body, even if there are nested 'wait's in it.
    BaseResponse::linearize(next, continuation);
    BaseResponse::linearize(params.body(), this);
  }

  void run(RuleContext &ctx) override {
    // Check if we're in progress (are at the top of the repeat stack)
    if (ctx.repeatStack.size() > 0) {
      if (auto &top = ctx.repeatStack.back(); top.response == this) {
        // Check that we have repetitions left and also that the current actor exists
        if (top.count > 0 && ctx.getScene().hasActor(ctx.actorId)) {
          // Continue -- decrement count and enter body
          --top.count;
          ++top.repeated;
          ctx.setNext(params.body());
        } else {
          // Stop -- pop ourselves off repeat stack and continue with `next` normally
          ctx.repeatStack.pop_back();
        }
        return;
      }
    }

    // Not in progress -- add ourselves to repeat stack
    if (auto count = std::max(0, params.count().eval<int>(ctx)); count > 0) {
      // We're about to do one repetition right away, so save `count - 1` to the stack
      ctx.repeatStack.push_back({ this, std::min(count, maxCount) - 1, 0 });
      ctx.setNext(params.body());
    }
  }
};

double evalInterval(double interval, std::string &intervalType, Clock &clock, bool quantize) {
  static constexpr double minInterval = 1 / 60.0;
  static constexpr double maxInterval = 30;
  if (intervalType == "second") {
    // return seconds
    interval = std::clamp(interval, minInterval, maxInterval);
  } else {
    // return clock duration
    if (intervalType == "step") {
      if (quantize) {
        interval = clock.getTimeUntilNext(Clock::Quantize::Step, interval);
      } else {
        interval = clock.getDuration(0, 0, interval);
      }
    } else if (intervalType == "beat") {
      if (quantize) {
        interval = clock.getTimeUntilNext(Clock::Quantize::Beat, interval);
      } else {
        interval = clock.getDuration(0, interval, 0);
      }
    } else if (intervalType == "bar") {
      if (quantize) {
        interval = clock.getTimeUntilNext(Clock::Quantize::Bar, interval);
      } else {
        interval = clock.getDuration(interval, 0, 0);
      }
    }
  }
  return interval;
}

struct InfiniteRepeatResponse : BaseResponse {
  inline static const RuleRegistration<InfiniteRepeatResponse, RulesBehavior> registration {
    "infinite repeat"
  };
  static constexpr auto description = "Repeat every N seconds";

  struct Params {
    PROP(
         std::string, intervalType,
         .label("interval type")
         .allowedValues("second", "beat", "bar", "step")
         ) = "second";
    PROP(
         double, interval,
         .label("interval")
         .min(1 / 60.0)
         .max(30)
         ) = 1;
    PROP(ResponseRef, body) = nullptr;
  } params;

  void linearize(ResponseRef continuation) override {
    // Set ourselves as the continuation after the body. This way execution will loop back around
    // to us after the body, even if there are nested 'wait's in it.
    BaseResponse::linearize(next, continuation);
    BaseResponse::linearize(params.body(), this);
  }

  void run(RuleContext &ctx) override {
    // We always come back here after waiting rather than directly enter the body so we can break
    // out if the actor was destroyed. `count == 0` means stop repeating, `count == 1` means wait,
    // `count == 2` means enter body.
    if (ctx.repeatStack.size() > 0 && ctx.repeatStack.back().response == this) {
      // Got back here -- check that we're not stopped and that the current actor exists
      auto count = ctx.repeatStack.back().count;
      if (count == 0 || !ctx.getScene().hasActor(ctx.actorId)) {
        // Stop -- remove ourselves from the repeat stack and continue with `next` normally
        ctx.repeatStack.pop_back();
      } else if (count == 1) {
        // Wait and come back here, setting count to 2 so we enter body immediately next time.
        // Schedule for next frame if interval is close enough to 60Hz.
        // Reference the original repeat startTime to avoid drifting future repeats.
        auto &scene = ctx.getScene();
        auto &rulesBehavior = scene.getBehaviors().byType<RulesBehavior>();
        ctx.repeatStack.back().count = 2;
        ctx.setNext(this);
        auto interval
            = evalInterval(params.interval(), params.intervalType(), scene.getClock(), false);
        auto performTime = interval < 0.02
            ? 0
            : ctx.repeatStack.back().startTime + (interval * (ctx.repeatStack.back().repeated + 1));
        if (params.intervalType() == "second") {
          rulesBehavior.schedule(ctx.suspend(), performTime);
        } else {
          rulesBehavior.scheduleClock(ctx.suspend(), performTime);
        }
      } else {
        // Enter the body immediately, setting count to 1 so we wait next time
        ctx.repeatStack.back().count = 1;
        ctx.repeatStack.back().repeated++;
        ctx.setNext(params.body());
      }
    } else {
      // Haven't started yet -- enter the body immediately, setting count to 1 so we wait next
      // time
      auto startTime = (params.intervalType() == "second") ? ctx.getScene().getPerformTime()
                                                           : ctx.getScene().getClock().getTime();
      ctx.repeatStack.push_back({ this, 1, 0, startTime });
      ctx.setNext(params.body());
    }
  }
};

struct StopRepeatingResponse : BaseResponse {
  inline static const RuleRegistration<StopRepeatingResponse, RulesBehavior> registration {
    "stop repeating"
  };
  static constexpr auto description = "Stop repeating";

  struct Params {
  } params;

  void run(RuleContext &ctx) override {
    if (ctx.repeatStack.size() > 0) {
      ctx.repeatStack.back().count = 0; // Cancels `RepeatResponse` and `InfiniteRepeatResponse`
    }
  }
};

struct ActOnResponse : BaseResponse {
  inline static const RuleRegistration<ActOnResponse, RulesBehavior> registration { "act on" };
  static constexpr auto description = "Tell actors with a tag to perform a response";

  struct Params {
    PROP(Tag, tag);
    PROP(ResponseRef, body) = nullptr;
  } params;

  void linearize(ResponseRef continuation) override {
    // Same as `RepeatResponse::linearize`
    BaseResponse::linearize(next, continuation);
    BaseResponse::linearize(params.body(), this);
  }

  void run(RuleContext &ctx) override {
    auto &tagsBehavior = ctx.getScene().getBehaviors().byType<TagsBehavior>();
    auto tag = params.tag();
    auto numActors = tagsBehavior.numActorsWithTag(tag);

    // Check if we're in progress (are at the top of the act-on stack)
    if (ctx.actOnStack.size() > 0) {
      if (auto &top = ctx.actOnStack.back(); top.response == this) {
        if (top.index < numActors) {
          // Still have actors left to visit -- set to visit next actor, increment index, enter
          // body
          ctx.actorId = tagsBehavior.indexActorWithTag(tag, top.index);
          ++top.index;
          ctx.setNext(params.body());
        } else {
          // No actors left -- return to original actor, pop off stack, continue with `next`
          ctx.actorId = top.returnActorId;
          ctx.actOnStack.pop_back();
        }
        return;
      }
    }

    // Not in progress -- add ourselves to the act-on stack and start visiting actors
    if (numActors > 0) {
      ctx.actOnStack.push_back({ this, 1, ctx.actorId }); // Visiting index 0 right away, 1 is next
      ctx.actorId = tagsBehavior.indexActorWithTag(tag, 0);
      ctx.setNext(params.body());
    }
  }
};

struct ActOnClosestResponse : BaseResponse {
  inline static const RuleRegistration<ActOnClosestResponse, RulesBehavior> registration {
    "act on closest"
  };
  static constexpr auto description = "Tell closest actor with a tag to perform a response";

  struct Params {
    PROP(Tag, tag);
    PROP(ResponseRef, body) = nullptr;
  } params;

  void linearize(ResponseRef continuation) override {
    // Same as `RepeatResponse::linearize`
    BaseResponse::linearize(next, continuation);
    BaseResponse::linearize(params.body(), this);
  }

  void run(RuleContext &ctx) override {
    // Check if we're in progress (are at the top of the act-on stack)
    if (ctx.actOnStack.size() > 0) {
      if (auto &top = ctx.actOnStack.back(); top.response == this) {
        // Return to original actor, pop off stack, continue with `next`
        ctx.actorId = top.returnActorId;
        ctx.actOnStack.pop_back();
        return;
      }
    }

    auto &tagsBehavior = ctx.getScene().getBehaviors().byType<TagsBehavior>();
    auto &bodyBehavior = ctx.getScene().getBehaviors().byType<BodyBehavior>();
    auto tag = params.tag();
    ActorId otherActorId = nullActor;
    if (auto numActors = tagsBehavior.numActorsWithTag(tag); numActors == 0) {
      return;
    } else if (numActors == 1) {
      // Only one actor with this tag -- avoid extra logic and just return it
      otherActorId = tagsBehavior.indexActorWithTag(tag, 0);
    } else {
      // Multiple actors with this tag
      auto actorId = ctx.actorId;
      if (auto body = bodyBehavior.maybeGetPhysicsBody(actorId)) {
        // Current actor has a body -- return closest with tag
        auto pos = body->GetPosition();
        auto closestActorId = nullActor;
        auto closestSqDist = std::numeric_limits<float>::max();
        tagsBehavior.forEachActorWithTag(tag, [&](ActorId taggedActorId) {
          if (taggedActorId != actorId) {
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
        });
        otherActorId = closestActorId;
      } else {
        // Current actor doesn't have a body -- return first actor with tag
        otherActorId = tagsBehavior.indexActorWithTag(tag, 0);
      }
    }

    // Not in progress -- if `otherActorId` exists, add ourselves to the act-on stack and visit it
    if (ctx.getScene().hasActor(otherActorId)) {
      ctx.actOnStack.push_back({ this, 1, ctx.actorId }); // We don't really use `index`
      ctx.actorId = otherActorId;
      ctx.setNext(params.body());
    }
  }
};

struct ActOnOtherResponse : BaseResponse {
  inline static const RuleRegistration<ActOnOtherResponse, RulesBehavior> registration {
    "act on other"
  };
  static constexpr auto description = "Tell the colliding actor to perform a response";

  struct Params {
    PROP(ResponseRef, body) = nullptr;
  } params;

  void linearize(ResponseRef continuation) override {
    // Same as `RepeatResponse::linearize`
    BaseResponse::linearize(next, continuation);
    BaseResponse::linearize(params.body(), this);
  }

  void run(RuleContext &ctx) override {
    // Check if we're in progress (are at the top of the act-on stack)
    if (ctx.actOnStack.size() > 0) {
      if (auto &top = ctx.actOnStack.back(); top.response == this) {
        // Return to original actor, pop off stack, continue with `next`
        ctx.actorId = top.returnActorId;
        ctx.actOnStack.pop_back();
        return;
      }
    }

    // Not in progress -- if `otherActorId` exists, add ourselves to the act-on stack and visit it
    if (auto otherActorId = ctx.extras.otherActorId; ctx.getScene().hasActor(otherActorId)) {
      ctx.actOnStack.push_back({ this, 1, ctx.actorId }); // We don't really use `index`
      ctx.actorId = otherActorId;
      ctx.setNext(params.body());
    }
  }
};


//
// Clock triggers
//

struct ClockReachesBeatTrigger : BaseTrigger {
  inline static const RuleRegistration<ClockReachesBeatTrigger, RulesBehavior> registration {
    "clock reaches beat"
  };
  static constexpr auto description = "When the clock reaches a beat";

  struct Params {
    PROP(std::string, intervalType,
         .label("interval type")
         .allowedValues("beat", "step")
         ) = "beat";
    // count == 0: every beat/step
    // count == N > 0: every Nth in the superunit, e.g. every 2nd beat of a bar
    PROP(int, count,
         .label("count")
         .min(0)
         ) = 0;
  } params;
};

struct ClockReachesBarTrigger : BaseTrigger {
  inline static const RuleRegistration<ClockReachesBarTrigger, RulesBehavior> registration {
    "clock reaches bar"
  };
  static constexpr auto description = "When the clock reaches a bar";

  struct Params {
    // every cycle'th bar (so cycle == 1 means every bar)
    PROP(int, cycle,
         .label("cycle")
         .min(1)
         ) = 1;
  } params;
};

void RulesBehavior::fireBeatTriggers(Clock::Quantize unit, int index) {
  switch (unit) {
  case Clock::Quantize::Bar: {
    fireAllIf<ClockReachesBarTrigger>(
        {}, [&](ActorId actorId, const ClockReachesBarTrigger &trigger) {
          auto cycle = trigger.params.cycle();
          return (cycle <= 1 || index % cycle == 0);
        });
    break;
  }
  case Clock::Quantize::Beat: {
    fireAllIf<ClockReachesBeatTrigger>(
        {}, [&](ActorId actorId, const ClockReachesBeatTrigger &trigger) {
          if (trigger.params.intervalType() == "beat") {
            return (trigger.params.count() == 0 || trigger.params.count() == index + 1);
          }
          return false;
        });
    break;
  }
  case Clock::Quantize::Step: {
    fireAllIf<ClockReachesBeatTrigger>(
        {}, [&](ActorId actorId, const ClockReachesBeatTrigger &trigger) {
          if (trigger.params.intervalType() == "step") {
            return (trigger.params.count() == 0 || trigger.params.count() == index + 1);
          }
          return false;
        });
    break;
  }
  }
}


//
// Clock responses
//

struct SetClockTempoResponse : BaseResponse {
  inline static const RuleRegistration<SetClockTempoResponse, RulesBehavior> registration {
    "set clock tempo"
  };
  static constexpr auto description = "Set the clock tempo";

  struct Params {
    PROP(ExpressionRef, tempo, .min(30) .max(360)) = 120;
  } params;

  void run(RuleContext &ctx) override {
    auto &scene = ctx.getScene();
    auto tempo = params.tempo().eval<int>(ctx);
    scene.getClock().setTempo(tempo);
  }
};


//
// Timing responses
//

struct WaitResponse : BaseResponse {
  inline static const RuleRegistration<WaitResponse, RulesBehavior> registration { "wait" };
  static constexpr auto description = "Wait before a response";

  struct Params {
    PROP(
         std::string, intervalType,
         .label("interval type")
         .allowedValues("second", "beat", "bar", "step")
         ) = "second";
    PROP(
         ExpressionRef, duration,
         .label("duration")
         .min(1 / 60.0)
         .max(30)
         ) = 1;
    PROP(bool, quantize, .label("quantize")) = true;
  } params;

  void run(RuleContext &ctx) override {
    if (next) {
      auto &scene = ctx.getScene();
      auto &rulesBehavior = scene.getBehaviors().byType<RulesBehavior>();
      auto duration = params.duration().eval<double>(ctx);
      duration = evalInterval(duration, params.intervalType(), scene.getClock(), params.quantize());
      if (params.intervalType() == "second") {
        rulesBehavior.schedule(ctx.suspend(), scene.getPerformTime() + duration);
      } else {
        rulesBehavior.scheduleClock(ctx.suspend(), scene.getClock().getTime() + duration);
      }
    }
  }
};


//
// Expressions responses
//

struct ExpressionMeetsConditionResponse : BaseResponse {
  inline static const RuleRegistration<ExpressionMeetsConditionResponse, RulesBehavior>
      registration { "expression meets condition" };
  static constexpr auto description = "If an expression meets a condition";

  struct Params {
    PROP(ExpressionRef, lhs) = 0;
    PROP(ExpressionComparison, comparison);
    PROP(ExpressionRef, rhs) = 0;
  } params;

  bool eval(RuleContext &ctx) override {
    return params.comparison().compare(params.lhs().eval(ctx), params.rhs().eval(ctx));
  }
};


//
// Random responses
//

struct CoinFlipResponse : BaseResponse {
  inline static const RuleRegistration<CoinFlipResponse, RulesBehavior> registration {
    "coin flip"
  };
  static constexpr auto description = "If a coin flip shows heads";

  struct Params {
    PROP(
         ExpressionRef, probability,
         .label("probability of heads")
         .min(0)
         .max(1)
         ) = 0.5;
  } params;

  bool eval(RuleContext &ctx) override {
    auto probability = std::clamp(params.probability().eval<double>(ctx), 0.0, 1.0);
    return ctx.getScene().getRNG().random() < probability;
  }
};


//
// Sound responses
//

struct PlaySoundResponse : BaseResponse {
  inline static const RuleRegistration<PlaySoundResponse, RulesBehavior> registration {
    "play sound"
  };
  static constexpr auto description = "Play a sound";

  using Params = Sample;
  Params params;

  void run(RuleContext &ctx) override {
    auto &sound = ctx.getScene().getSound();
    auto playbackRate = std::clamp(
        params.playbackRate().eval<double>(ctx), Sample::minPlaybackRate, Sample::maxPlaybackRate);
    sound.play(params, playbackRate, 1.0f);
  }

  void init(Scene &scene) {
    auto &sound = scene.getSound();
    sound.preload(params);
  }
};

struct StopAllSoundResponse : BaseResponse {
  inline static const RuleRegistration<StopAllSoundResponse, RulesBehavior> registration {
    "stop all sound"
  };
  static constexpr auto description = "Stop all sound";

  struct Params {
  } params;
  void run(RuleContext &ctx) override {
    auto &sound = ctx.getScene().getSound();
    sound.stopAll();
  }
};


struct EditorChangeSoundReceiver {
  inline static const BridgeRegistration<EditorChangeSoundReceiver> registration {
    "EDITOR_CHANGE_SOUND"
  };

  Sample params;

  void receive(Engine &engine) {
    if (!engine.getIsEditing())
      return;

    auto &scene = engine.maybeGetEditor()->getScene();
    auto &sound = scene.getSound();
    RuleContext independent { nullptr, nullActor, {}, scene };
    sound.play(params, params.playbackRate().eval<double>(independent), 1.0f);
  }
};

//
// Meta responses
//

//#define DEBUG_LOG_NOTE_RESPONSE // Uncomment to log note messages

struct NoteResponse : BaseResponse {
  inline static const RuleRegistration<NoteResponse, RulesBehavior> registration { "note" };
  static constexpr auto description = "Add a note to this rule";

  struct Params {
    // TODO: would be nice to skip loading this if we're not editing the scene
    PROP(std::string, note);
  } params;

  void run(RuleContext &ctx) override {
#ifdef DEBUG_LOG_NOTE_RESPONSE
    Debug::log("actor {} note: {}", ctx.actorId, params.note());
#endif
  }
};


//
// Variables triggers
//

struct VariableChangesTrigger : BaseTrigger {
  inline static const RuleRegistration<VariableChangesTrigger, RulesBehavior> registration {
    "variable changes"
  };
  static constexpr auto description = "When a variable changes";

  struct Params {
    PROP(
         Variable, variableId,
         .label("variable")
         );
  } params;
};

struct VariableReachesValueTrigger : BaseTrigger {
  inline static const RuleRegistration<VariableReachesValueTrigger, RulesBehavior> registration {
    "variable reaches value"
  };
  static constexpr auto description = "When a variable reaches a value";

  struct Params {
    PROP(
         Variable, variableId,
         .label("variable")
         );
    PROP(ExpressionComparison, comparison);
    PROP(ExpressionRef, value) = 0;
  } params;
};

void RulesBehavior::fireVariablesTriggers(Variable variable, const ExpressionValue &value) {
  // PERF: Scans through /all/ variable-related triggers to find the ones pertaining to this
  //       variable. Maybe keep a mapping from variable somewhere? Would also have to add / remove
  //       those mappings as actors are added / removed.
  fireAllIf<VariableChangesTrigger>(
      {}, [&](ActorId actorId, const VariableChangesTrigger &trigger) {
        return trigger.params.variableId() == variable;
      });
  fireAllIf<VariableReachesValueTrigger>(
      {}, [&](ActorId actorId, const VariableReachesValueTrigger &trigger) {
        return trigger.params.variableId() == variable
            && trigger.params.comparison().compare(value, evalIndependent(trigger.params.value()));
      });
}

struct VariableReachesValueTriggerOnAddMarker {
  // Added to newly added actors to remind ourselves to fire 'variable reaches value' triggers on
  // it for the current value of variables
};


//
// Variables responses
//

struct ResetVariableResponse : BaseResponse {
  inline static const RuleRegistration<ResetVariableResponse, RulesBehavior> registration {
    "reset variable"
  };
  static constexpr auto description = "Reset a variable to its initial value";

  struct Params {
    PROP(Variable, variableId, .label("variable"));
  } params;

  void run(RuleContext &ctx) override {
    ctx.getScene().getVariables().reset(params.variableId());
  }
};

struct ResetAllVariablesResponse : BaseResponse {
  inline static const RuleRegistration<ResetAllVariablesResponse, RulesBehavior> registration {
    "reset all variables"
  };
  static constexpr auto description = "Reset all variables to their initial values";

  struct Params {
  } params;

  void run(RuleContext &ctx) override {
    ctx.getScene().getVariables().resetAll();
  }
};

struct SetVariableResponse : BaseResponse {
  inline static const RuleRegistration<SetVariableResponse, RulesBehavior> registration {
    "set variable"
  };
  static constexpr auto description = "Modify the value of a variable";

  struct Params {
    PROP(Variable, variableId, .label("variable"));
    PROP(ExpressionRef, setToValue, .label("set to value"));
    PROP(bool, relative);
  } params;

  void run(RuleContext &ctx) override {
    auto variable = params.variableId();
    auto &variables = ctx.getScene().getVariables();
    auto value = params.setToValue().eval(ctx);
    if (params.relative() && value.is<double>()) {
      variables.set(variable, variables.get(variable).as<double>() + value.as<double>());
    } else {
      variables.set(variable, value);
    }
  }
};

struct VariableMeetsConditionResponse : BaseResponse {
  inline static const RuleRegistration<VariableMeetsConditionResponse, RulesBehavior> registration {
    "variable meets condition"
  };
  static constexpr auto description = "If a variable meets a condition";

  struct Params {
    PROP(Variable, variableId, .label("variable"));
    PROP(ExpressionComparison, comparison);
    PROP(ExpressionRef, value);
  } params;

  bool eval(RuleContext &ctx) override {
    auto &variables = ctx.getScene().getVariables();
    auto value = params.value().eval(ctx);
    return params.comparison().compare(variables.get(params.variableId()), value);
  }
};

struct SaveVariableToLeaderboardResponse : BaseResponse {
  inline static const RuleRegistration<SaveVariableToLeaderboardResponse, RulesBehavior>
      registration { "save variable to leaderboard" };
  static constexpr auto description = "Save a variable to the leaderboard";

  struct Params {
    PROP(Variable, variableId, .label("variable"));
  } params;

  void run(RuleContext &ctx) override {
    if (ctx.getScene().getIsEditing())
      return;

    auto &variables = ctx.getScene().getVariables();
    auto name = variables.getName(params.variableId());
    auto value = std::to_string(variables.get(params.variableId()).as<double>());
    auto deckId = ctx.getScene().getDeckId();
    if (name && deckId) {
      API::enqueueGraphQLRequest("mutation {\n  saveVariableToLeaderboard(deckId: \"" + *deckId
              + "\", variable: \"" + *name + "\", score: " + value + ")\n}",
          [=](APIResponse &response) {
          });
    }
  }
};

struct ShowLeaderboardResponse : BaseResponse {
  inline static const RuleRegistration<ShowLeaderboardResponse, RulesBehavior> registration {
    "show leaderboard"
  };
  static constexpr auto description = "Show the leaderboard for a variable";

  struct Params {
    PROP(Variable, variableId, .label("variable"));
    PROP(
         std::string, type,
         .label("sort")
         .allowedValues(
             "high",
             "low"
           )
         ) = "high";
    PROP(
         std::string, filter,
         .allowedValues(
             "each user once",
             "each user multiple times"
           )
         ) = "each user once";
    PROP(std::string, label, .label("label")) = "Score";
  } params;

  void readLeaderboardRow(CoreViewRenderer &leaderboardView, Reader &reader, std::string i) {
    leaderboardView.updateProp("place-" + i, "text", "#" + std::string(reader.str("place", "")));
    leaderboardView.updateProp("score-" + i, "text", reader.str("score", ""));

    reader.obj("user", [&]() {
      std::string username = reader.str("username", "");
      leaderboardView.updateProp("username-" + i, "text", reader.str("username", ""));
      reader.obj("photo", [&]() {
        leaderboardView.updateProp("avatar-" + i, "url", reader.str("smallAvatarUrl", ""));
      });
    });
  }

  void run(RuleContext &ctx) override {
    auto &variables = ctx.getScene().getVariables();
    auto name = variables.getName(params.variableId());
    auto type = params.type();
    auto filter = params.filter();
    if (filter == "each user once") {
      filter = "dedupUsers";
    } else {
      filter = "none";
    }
    auto &leaderboardView = ctx.getScene().getLeaderboardView();
    leaderboardView.reset();
    leaderboardView.updateProp("label", "text", params.label());

    auto deckId = ctx.getScene().getDeckId();

    if (name && deckId) {
      API::enqueueGraphQLRequest("{\n  leaderboard(deckId: \"" + *deckId + "\", variable: \""
              + *name + "\", type: " + type + ", filter: " + filter
              + ") {\n    list {\n place\n score\n user {\n username\n photo {\n "
                "smallAvatarUrl}}}\n  }\n}",
          [&](APIResponse &response) {
            auto &reader = response.reader;
            leaderboardView.updateProp("leaderboard", "visibility", "visible");
            leaderboardView.updateProp("editorText", "visibility", "hidden");

            reader.obj("data", [&]() {
              reader.obj("leaderboard", [&]() {
                reader.arr("list", [&]() {
                  int iNum = 1;
                  reader.each([&]() {
                    if (iNum > 10) {
                      return;
                    }

                    auto i = std::to_string(iNum);
                    readLeaderboardRow(leaderboardView, reader, i);

                    iNum++;
                  });
                });
              });
            });
          });
    } else {
      leaderboardView.updateProp("leaderboard", "visibility", "visible");
      leaderboardView.updateProp("editorText", "visibility", "visible");
    }
  }
};

//
// Camera responses
//

struct FollowWithCameraResponse : BaseResponse {
  inline static const RuleRegistration<FollowWithCameraResponse, RulesBehavior> registration {
    "follow with camera"
  };
  static constexpr auto description = "Follow this with the camera";

  struct Params {
  } params;

  void run(RuleContext &ctx) override {
    ctx.getScene().setCameraTarget(ctx.actorId);
  }
};

//
// Order responses
//

struct MoveToFrontResponse : BaseResponse {
  inline static const RuleRegistration<MoveToFrontResponse, RulesBehavior> registration {
    "move to front"
  };
  static constexpr auto description = "Move this actor to the front";

  struct Params {
  } params;

  void run(RuleContext &ctx) override {
    Scene::DrawOrderParams params;
    params.relativity = Scene::DrawOrderParams::FrontOfAll;
    ctx.getScene().setDrawOrder(ctx.actorId, params);
  }
};

struct MoveToBackResponse : BaseResponse {
  inline static const RuleRegistration<MoveToBackResponse, RulesBehavior> registration {
    "move to back"
  };
  static constexpr auto description = "Move this actor to the back";

  struct Params {
  } params;

  void run(RuleContext &ctx) override {
    Scene::DrawOrderParams params;
    params.relativity = Scene::DrawOrderParams::BehindAll;
    ctx.getScene().setDrawOrder(ctx.actorId, params);
  }
};


//
// Constructor, destructor
//

RulesBehavior::~RulesBehavior() {
  // Call destructors on pool-allocated objects
  for (auto response : responses) {
    response->~BaseResponse();
  }
}


//
// Lifecycle
//

void RulesBehavior::handlePreRemoveActor(ActorId actorId, RulesComponent &component) {
  fire<DestroyTrigger>(actorId, {});
}


//
// Read, write
//

void RulesBehavior::handleReadComponent(
    ActorId actorId, RulesComponent &component, Reader &reader) {
  if (getScene().getIsEditing()) {
    component.editData = std::make_unique<RulesEditData>();
    component.editData->set(*reader.jsonValue());
    return;
  }
  reader.each("rules", [&]() {
    // Response
    ResponseRef response = nullptr;
    reader.obj("response", [&]() {
      if (auto index = reader.num("index")) {
        // Pre-existing response from index
        response = getResponse(*index);
      } else if (auto found = responseCache.find((void *)reader.jsonValue());
                 found != responseCache.end()) {
        // Pre-existing response found in cache
        response = found->second;
      } else {
        // New JSON -- read and cache it
        response = readResponse(reader);
        if (response) {
          // This is a root, so linearize from here
          response->linearize(nullptr);
        }
        responseCache.insert_or_assign((void *)reader.jsonValue(), response);
      }
    });
    if (!response) {
      return; // Failed to load response
    }

    // Trigger
    reader.obj("trigger", [&]() {
      // Find loader by name and behavior id
      if (auto name = reader.str("name")) {
        if (auto behaviorId = reader.num("behaviorId")) {
          auto nameHash = entt::hashed_string(*name).value();
          for (auto &loader : triggerLoaders) {
            if (loader.behaviorId == *behaviorId && nameHash == loader.nameHs.value()
                && !std::strcmp(*name, loader.nameHs.data())) {
              loader.read(*this, actorId, response, reader);
              return;
            }
          }
        }
        Debug::log("RulesBehavior: unsupported trigger type '{}'", *name);
      }
    });
  });

  // Keep a reminder to fire variable reaches value trigger for current variable values
  getScene().getEntityRegistry().emplace<VariableReachesValueTriggerOnAddMarker>(actorId);
}

ResponseRef RulesBehavior::readResponse(Reader &reader) {
  // Find loader by name and behavior id
  if (auto name = reader.str("name")) {
    if (auto behaviorId = reader.num("behaviorId")) {
      auto nameHash = entt::hashed_string(*name).value();
      for (auto &loader : responseLoaders) {
        if (loader.behaviorId == *behaviorId && nameHash == loader.nameHs.value()
            && !std::strcmp(*name, loader.nameHs.data())) {
          return loader.read(*this, reader);
        }
      }
    }
    Debug::log("RulesBehavior: unsupported response type '{}'", *name);
  }
  return nullptr;
}

int RulesBehavior::getDestroyResponseIndex() {
  if (destroyResponseIndex == -1) {
    auto response = (DestroyResponse *)pool.Malloc(sizeof(DestroyResponse));
    new (response) DestroyResponse();
    responses.emplace_back(response);
    destroyResponseIndex = int(responses.size()) - 1;
  };
  return destroyResponseIndex;
}

void RulesBehavior::readExpression(ExpressionRef &expr, Reader &reader) {
  switch (auto jsonValue = reader.jsonValue(); jsonValue->GetType()) {
  case json::kNumberType: {
    // Plain number value
    expr.constant = jsonValue->GetDouble();
    break;
  }
  case json::kFalseType:
  case json::kTrueType: {
    // Plain boolean value
    expr.constant = jsonValue->GetBool();
    break;
  }
  case json::kStringType: {
    // Plain string value
    auto length = jsonValue->GetStringLength();
    auto str = (char *)pool.Malloc(length + 1);
    std::memcpy(str, jsonValue->GetString(), length);
    str[length] = '\0';
    expr.constant = str;
    break;
  }
  case json::kObjectType: {
    // Nested expression -- find loader by type
    if (auto name = reader.str("expressionType")) {
      auto nameHash = entt::hashed_string(*name).value();
      for (auto &loader : expressionLoaders) {
        if (nameHash == loader.nameHs.value() && !std::strcmp(*name, loader.nameHs.data())) {
          loader.read(expr, *this, reader);
          return;
        }
      }
      Debug::log("RulesBehavior: unsupported expression type '{}'", *name);
    }
    break;
  }
  case json::kArrayType:
  case json::kNullType: {
    // Unsupported
    break;
  }
  }
}

void RulesBehavior::handleWriteComponent(
    ActorId actorId, const RulesComponent &component, Writer &writer) const {
  if (component.editData) {
    writer.setValue(component.editData->value);
  }
}


//
// Perform
//

void RuleContext::run() {
  auto curr = next;
  while (curr) {
    next = curr->next; // Default to the response's `next`. It'll have an opportunity to override
                       // this in its `run()`.
    curr->run(*this);
    curr = next;
  }
}

void RulesBehavior::handlePerform(double dt) {
  auto &scene = getScene();
  auto &registry = scene.getEntityRegistry();

  // Fire create triggers. Then clear them so they're only run once on each actor.
  fireAllEnabled<CreateTrigger>({});
  registry.clear<TriggerComponent<CreateTrigger>>();

  // Fire 'variable reaches value' triggers that match the current value for actors that were
  // newly added. Then clear the markers so we only check once on each actor. We skip this on the
  // first frame to let variables be updated once before comparison (eg. to count initial actors).
  if (!firstFrame) {
    auto &variables = scene.getVariables();
    fireAllIf<VariableReachesValueTrigger, VariableReachesValueTriggerOnAddMarker>(
        {}, [&](ActorId actorId, const VariableReachesValueTrigger &trigger) {
          auto &currValue = variables.get(trigger.params.variableId());
          return trigger.params.comparison().compare(
              currValue, evalIndependent(trigger.params.value()));
        });
    registry.clear<VariableReachesValueTriggerOnAddMarker>();
  }

  // Make sure draw orders are compacted before responses are run so that `CreateResponse`s cause
  // correct relative draw orders to be set
  scene.ensureDrawOrderSort();

  // Run contexts. Move ready contexts from `scheduleds` to `current`, then run and clear
  // `current`. We don't run contexts directly from `scheduleds` because they could schedule new
  // contexts when run, which would modify `scheduleds` and invalidate the iteration.
  auto performTime = scene.getPerformTime();
  auto clockTime = scene.getClock().getTime();
  Debug::display("scheduled: {}", scheduleds.size());
  scheduleds.erase(std::remove_if(scheduleds.begin(), scheduleds.end(),
                       [&](Scheduled &scheduled) {
                         if (scheduled.clockTime > 0) {
                           if (clockTime >= scheduled.clockTime) {
                             if (isValidToResume(scheduled.ctx)) {
                               current.push_back(std::move(scheduled.ctx));
                             }
                             return true;
                           } else {
                             return false;
                           }
                         }
                         if (performTime >= scheduled.performTime) {
                           if (isValidToResume(scheduled.ctx)) {
                             current.push_back(std::move(scheduled.ctx));
                           }
                           return true;
                         }
                         return false;
                       }),
      scheduleds.end());
  Debug::display("current: {}", current.size());
  for (auto &ctx : current) {
    ctx.run();
  }
  current.clear();

  // Actually remove actors marked by `DestroyResponse`.
  registry.view<DestroyResponseMarker>().each([&](ActorId actorId) {
    // Destroying the current entity while iterating is safe according to:
    // https://github.com/skypjack/entt/wiki/Crash-Course:-entity-component-system#what-is-allowed-and-what-is-not
    scene.removeActor(actorId);
  });

  firstFrame = false;
}
