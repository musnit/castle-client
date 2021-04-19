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
    PROP(float, xOffset) = 0;
    PROP(float, yOffset) = 0;
    PROP(float, xAbsolute) = 0;
    PROP(float, yAbsolute) = 0;
    PROP(float, angle) = 0;
    PROP(float, distance) = 0;
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
          newPos = creatorPos + b2Vec2(params.xOffset(), params.yOffset());
        } else {
          // Relative angle and distance
          auto angle = params.angle() + creatorAngle;
          newPos = creatorPos + params.distance() * b2Vec2(std::cos(angle), std::sin(angle));
        }
      } else {
        // Absolute
        newPos = { params.xAbsolute(), params.yAbsolute() };
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
    // Linearize normally, then set `next` as a continuation after either branch. This ensures
    // nested 'wait's in either branch block outer responses.  If any branch doesn't exist, default
    // it to just proceeding with next responses.
    BaseResponse::linearize(continuation);
    if (params.then()) {
      params.then()->linearize(next);
    } else {
      params.then() = next;
    }
    if (params.else_()) {
      params.else_()->linearize(next);
    } else {
      params.else_() = next;
    }
  }

  void run(RuleContext &ctx) override {
    // Default to 'then' branch on non-existent condition
    if (auto condition = params.condition(); !condition || condition->eval(ctx)) {
      ctx.next = params.then();
    } else {
      ctx.next = params.else_();
    }
  }
};


//
// Timing responses
//

struct WaitResponse : BaseResponse {
  inline static const RuleRegistration<WaitResponse> registration { "wait", 16 };

  struct Params {
    PROP(double, duration) = 1;
  } params;

  void run(RuleContext &ctx) override {
    if (next) {
      auto &scene = ctx.getScene();
      auto &rulesBehavior = scene.getBehaviors().byType<RulesBehavior>();
      rulesBehavior.schedule(ctx.suspend(), scene.getPerformTime() + params.duration());
    }
  }
};


//
// Random responses
//

struct CoinFlipResponse : BaseResponse {
  inline static const RuleRegistration<CoinFlipResponse> registration { "coin flip", 16 };

  struct Params {
    PROP(double, probability) = 0.5;
  } params;

  bool eval(RuleContext &ctx) override {
    return ctx.getScene().getRNG().random() < params.probability();
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


//
// Perform
//

void RulesBehavior::handlePerform(double dt) {
  auto &scene = getScene();

  // Fire create triggers. Then clear them so they're only run once on each actor.
  fireAll<CreateTrigger>();
  scene.getEntityRegistry().clear<TriggerComponent<CreateTrigger>>();

  // Run responses. Move ready responses from `scheduled` to `current`, then run and clear
  // `current`. We don't run responses directly from `scheduled` because they could schedule new
  // responses when run, which would modify `scheduled` and invalidate the iteration.
  auto performTime = scene.getPerformTime();
  Debug::display("scheduled: {}", scheduled.size());
  scheduled.erase(std::remove_if(scheduled.begin(), scheduled.end(),
                      [&](Thread &thread) {
                        if (performTime >= thread.scheduledPerformTime) {
                          current.push_back(std::move(thread));
                          return true;
                        }
                        return false;
                      }),
      scheduled.end());
  Debug::display("current: {}", current.size());
  for (auto &thread : current) {
    auto &ctx = thread.ctx;
    auto curr = ctx.next;
    while (curr) {
      ctx.next = curr->next;
      curr->run(ctx);
      curr = ctx.next;
    }
  }
  current.clear();
}
