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

struct CreateResponse final : BaseResponse {
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

  void run(const RuleContext &ctx) override {
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
        b2Vec2 creatorPos;
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
// Timing responses
//

struct WaitResponse final : BaseResponse {
  inline static const RuleRegistration<WaitResponse> registration { "wait", 16 };

  struct Params {
    PROP(double, duration);
  } params;

  ResponseRef body = nullptr;

  void linearize(ResponseRef continuation) override {
    // Linearize normally, then unset `next` so `BaseResponse` doesn't automatically continue in
    // `runChain()`. We'll save the original value and schedule it ourselves.
    BaseResponse::linearize(continuation);
    body = next;
    next = nullptr;
  }

  void run(const RuleContext &ctx) override {
    if (body) {
      auto &scene = ctx.getScene();
      auto &rulesBehavior = scene.getBehaviors().byType<RulesBehavior>();
      rulesBehavior.schedule(body, ctx.move(), scene.getPerformTime() + params.duration());
    }
  }
};


//
// Meta responses
//

struct NoteResponse final : BaseResponse {
  inline static const RuleRegistration<NoteResponse> registration { "note", 16 };

  struct Params {
    // NOTE: Skipping because we don't actually use it when running, so avoid parsing overhead
    // PROP(std::string, note);
  } params;

  void run(const RuleContext &ctx) override {
    // Nothing to do...
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
              break;
            }
          }
        }
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
  scene.addDebugMessage("scheduled: {}", scheduled.size());
  scheduled.erase(std::remove_if(scheduled.begin(), scheduled.end(),
                      [&](Thread &thread) {
                        if (performTime >= thread.scheduledPerformTime) {
                          current.push_back(std::move(thread));
                          return true;
                        }
                        return false;
                      }),
      scheduled.end());
  scene.addDebugMessage("current: {}", current.size());
  for (auto &thread : current) {
    if (thread.response) { // Some times this is `nullptr` under extreme memory pressure...
      thread.response->runChain(thread.ctx);
    }
  }
  current.clear();
}
