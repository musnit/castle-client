#include "rules.h"

#include "behaviors/all.h"


//
// Lifecycle triggers
//

struct CreateTrigger : BaseTrigger {
  inline static const RuleRegistration<CreateTrigger> registration { "create", 16 };

  struct Params {
  } params;
};

struct DestroyTrigger : BaseTrigger {
  inline static const RuleRegistration<DestroyTrigger> registration { "destroy", 16 };

  struct Params {
  } params;
};


//
// Lifecycle responses
//

struct CreateResponse : BaseResponse {
  inline static const RuleRegistration<CreateResponse> registration { "create", 16 };

  struct Params {
    PROP(std::string, entryId);
    PROP(std::string, coordinateSystem) = "relative position";
    PROP(ExpressionRef, xOffset) = 0;
    PROP(ExpressionRef, yOffset) = 0;
    PROP(ExpressionRef, xAbsolute) = 0;
    PROP(ExpressionRef, yAbsolute) = 0;
    PROP(ExpressionRef, angle) = 0;
    PROP(ExpressionRef, distance) = 0;
    PROP(std::string, depth) = "in front of all actors";
  } params;

  void run(RuleContext &ctx) override {
    auto &scene = ctx.getScene();

    // Make sure we have an `entryId`
    auto &entryId = params.entryId();
    if (entryId.empty()) {
      return;
    }

    // Create actor and make sure that was successful
    auto newActorId = scene.addActor(nullptr, entryId.c_str());
    if (newActorId == nullActor) {
      return;
    }

    // TODO(nikki): Handle depth

    // Set position
    auto &bodyBehavior = scene.getBehaviors().byType<BodyBehavior>();
    if (auto newBody = bodyBehavior.maybeGetPhysicsBody(newActorId)) {
      b2Vec2 newPos;
      auto &coordinateSystem = params.coordinateSystem();
      if (coordinateSystem[0] == 'r') { // Whether starts with "relative" or "absolute"
        // Relative
        auto creatorPos = b2Vec2(0, 0);
        float creatorAngle = 0;
        if (auto creatorBody = bodyBehavior.maybeGetPhysicsBody(ctx.actorId)) {
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
          auto angle = params.angle().eval<float>(ctx) + creatorAngle;
          auto distance = params.distance().eval<float>(ctx);
          newPos = creatorPos + distance * b2Vec2(std::cos(angle), std::sin(angle));
        }
      } else {
        // Absolute
        auto xAbsolute = params.xAbsolute().eval<float>(ctx);
        auto yAbsolute = params.yAbsolute().eval<float>(ctx);
        newPos = { xAbsolute, yAbsolute };
      }
      newBody->SetTransform(newPos, newBody->GetAngle());
    }
  }
};


//
// Control flow responses
//

struct IfResponse : BaseResponse {
  inline static const RuleRegistration<IfResponse> registration { "if", 16 };

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
  inline static const RuleRegistration<RepeatResponse> registration { "repeat", 16 };

  struct Params {
    PROP(ExpressionRef, count) = 3;
    PROP(ResponseRef, body) = nullptr;
  } params;

  void linearize(ResponseRef continuation) override {
    // Set ourselves as the continuation after the body. This way execution will loop back around to
    // us after the body, even if there are nested 'wait's in it.
    BaseResponse::linearize(next, continuation);
    BaseResponse::linearize(params.body(), this);
  }

  void run(RuleContext &ctx) override {
    // Check if we're in progress (are at the top of the repeat stack)
    if (ctx.repeatStack.size() > 0) {
      if (auto &top = ctx.repeatStack.back(); top.response == this) {
        if (top.count > 0) {
          // Have repetitions left -- decrement and enter body
          --top.count;
          ctx.setNext(params.body());
        } else {
          // No repetitions left -- pop ourselves off repeat stack and continue with `next` normally
          ctx.repeatStack.pop_back();
        }
        return;
      }
    }

    // Not in progress -- add ourselves to repeat stack
    if (auto count = params.count().eval<int>(ctx); count > 0) {
      // We're about to do one repetition right away, so save `count - 1` to the stack
      ctx.repeatStack.push_back({ this, count - 1 });
      ctx.setNext(params.body());
    }
  }
};

struct InfiniteRepeatResponse : BaseResponse {
  inline static const RuleRegistration<InfiniteRepeatResponse> registration {
    "infinite repeat",
    16,
  };

  struct Params {
    PROP(double, interval) = 1;
    PROP(ResponseRef, body) = nullptr;
  } params;

  void linearize(ResponseRef continuation) override {
    // Set ourselves as the continuation after the body. This way execution will loop back around to
    // us after the body, even if there are nested 'wait's in it.
    BaseResponse::linearize(next, continuation);
    BaseResponse::linearize(params.body(), this);
  }

  void run(RuleContext &ctx) override {
    if (ctx.repeatStack.size() > 0 && ctx.repeatStack.back().response == this) {
      // We got back here after the body -- check whether to stop or continue
      if (ctx.repeatStack.back().count == 0) {
        // Stopped -- remove ourselves from the repeat stack and continue with `next` normally
        ctx.repeatStack.pop_back();
      } else {
        // Not stopped -- schedule `body` to after the interval, or the next frame if the interval
        // is close enough to 60Hz
        ctx.setNext(params.body());
        auto &scene = ctx.getScene();
        auto &rulesBehavior = scene.getBehaviors().byType<RulesBehavior>();
        auto interval = params.interval();
        auto performTime = interval < 0.02 ? 0 : scene.getPerformTime() + interval;
        rulesBehavior.schedule(ctx.suspend(), performTime);
      }
    } else {
      // Haven't started yet -- add ourselves to the repeat stack and do one repetition right away
      ctx.repeatStack.push_back({ this, 1 }); // Just use `1`, we don't actually check the value
      ctx.setNext(params.body());
    }
  }
};

struct StopRepeatingResponse : BaseResponse {
  inline static const RuleRegistration<StopRepeatingResponse> registration { "stop repeating", 16 };

  struct Params {
  } params;

  void run(RuleContext &ctx) override {
    if (ctx.repeatStack.size() > 0) {
      ctx.repeatStack.back().count = 0;
    }
  }
};


//
// Timing responses
//

struct WaitResponse : BaseResponse {
  inline static const RuleRegistration<WaitResponse> registration { "wait", 16 };

  struct Params {
    PROP(ExpressionRef, duration) = 1;
  } params;

  void run(RuleContext &ctx) override {
    if (next) {
      auto &scene = ctx.getScene();
      auto &rulesBehavior = scene.getBehaviors().byType<RulesBehavior>();
      auto duration = params.duration().eval<double>(ctx);
      rulesBehavior.schedule(ctx.suspend(), scene.getPerformTime() + duration);
    }
  }
};


//
// Random responses
//

struct CoinFlipResponse : BaseResponse {
  inline static const RuleRegistration<CoinFlipResponse> registration { "coin flip", 16 };

  struct Params {
    PROP(ExpressionRef, probability) = 0.5;
  } params;

  bool eval(RuleContext &ctx) override {
    auto probability = params.probability().eval<double>(ctx);
    return ctx.getScene().getRNG().random() < probability;
  }
};


//
// Meta responses
//

#define DEBUG_LOG_NOTE_RESPONSE // Uncomment to log note messages

struct NoteResponse : BaseResponse {
  inline static const RuleRegistration<NoteResponse> registration { "note", 16 };

  struct Params {
#ifdef DEBUG_LOG_NOTE_RESPONSE
    PROP(std::string, note); // Only needed if we're going to log notes, skip overhead otherwise
#endif
  } params;

  void run(RuleContext &ctx) override {
#ifdef DEBUG_LOG_NOTE_RESPONSE
    Debug::log("actor {} note: {}", ctx.actorId, params.note());
#endif
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
  fire<DestroyTrigger>(actorId);
}


//
// Read, write
//

void RulesBehavior::handleReadComponent(
    ActorId actorId, RulesComponent &component, Reader &reader) {
  reader.each("rules", [&]() {
    // Response
    ResponseRef response = nullptr;
    reader.obj("response", [&]() {
      auto jsonPtr = (void *)reader.jsonValue();
      if (auto found = responseCache.find(jsonPtr); found != responseCache.end()) {
        // Found a pre-existing response for this JSON
        response = found->second;
      } else {
        // New JSON -- read and cache it
        response = readResponse(reader);
        if (response) {
          // This is a root, so linearize from here
          response->linearize(nullptr);
        }
        responseCache.insert_or_assign(jsonPtr, response);
      }
    });
    if (!response) {
      return; // Failed to load response
    }

    // Trigger
    reader.obj("trigger", [&]() {
      // Find loader by name and behavior id
      if (auto maybeName = reader.str("name")) {
        if (auto maybeBehaviorId = reader.num("behaviorId")) {
          auto nameHash = entt::hashed_string(*maybeName).value();
          for (auto &loader : triggerLoaders) {
            if (loader.behaviorId == *maybeBehaviorId && nameHash == loader.nameHs.value()
                && !std::strcmp(*maybeName, loader.nameHs.data())) {
              loader.read(getScene(), actorId, response, reader);
              return;
            }
          }
        }
        Debug::log("RulesBehavior: unsupported trigger type '{}'", *maybeName);
      }
    });
  });
}

ResponseRef RulesBehavior::readResponse(Reader &reader) {
  // Find loader by name and behavior id
  if (auto maybeName = reader.str("name")) {
    if (auto maybeBehaviorId = reader.num("behaviorId")) {
      auto nameHash = entt::hashed_string(*maybeName).value();
      for (auto &loader : responseLoaders) {
        if (loader.behaviorId == *maybeBehaviorId && nameHash == loader.nameHs.value()
            && !std::strcmp(*maybeName, loader.nameHs.data())) {
          return loader.read(*this, reader);
        }
      }
    }
    Debug::log("RulesBehavior: unsupported response type '{}'", *maybeName);
  }
  return nullptr;
}

void RulesBehavior::readExpression(ExpressionRef &expr, Reader &reader) {
  if (auto value = reader.num()) {
    // Plain number value
    expr.constant = *value;
  } else {
    // Nested expression -- find loader by type
    if (auto maybeName = reader.str("expressionType")) {
      auto nameHash = entt::hashed_string(*maybeName).value();
      for (auto &loader : expressionLoaders) {
        if (nameHash == loader.nameHs.value() && !std::strcmp(*maybeName, loader.nameHs.data())) {
          loader.read(expr, *this, reader);
        }
      }
      Debug::log("RulesBehavior: unsupported expression type '{}'", *maybeName);
    }
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

  // Fire create triggers. Then clear them so they're only run once on each actor.
  fireAll<CreateTrigger>();
  scene.getEntityRegistry().clear<TriggerComponent<CreateTrigger>>();

  // Run contexts. Move ready contexts from `scheduleds` to `current`, then run and clear `current`.
  // We don't run contexts directly from `scheduleds` because they could schedule new contexts when
  // run, which would modify `scheduleds` and invalidate the iteration.
  auto performTime = scene.getPerformTime();
  Debug::display("scheduled: {}", scheduleds.size());
  scheduleds.erase(std::remove_if(scheduleds.begin(), scheduleds.end(),
                       [&](Scheduled &scheduled) {
                         if (performTime >= scheduled.performTime) {
                           current.push_back(std::move(scheduled.ctx));
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
}
