#include "rules.h"

#include "behaviors/all.h"


//
// Basic triggers
//

struct CreateTrigger : BaseTrigger {
  inline static const RuleRegistration<CreateTrigger> registration { "create", 16 };

  struct Params {
  } params;
};


//
// Basic responses
//

struct NoteResponse final : BaseResponse {
  inline static const RuleRegistration<NoteResponse> registration { "note", 16 };

  struct Params {
    PROP(std::string, note);
  } params;

  void run(const RuleContext &ctx) override {
    fmt::print("actorId: {}, note: {}\n", ctx.actorId, params.note());
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
// Enable, disable
//

void RulesBehavior::handleDisableComponent(
    ActorId actorId, RulesComponent &component, bool removeActor) {
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
  fireTrigger<CreateTrigger>();
  scene.getEntityRegistry().clear<TriggerComponent<CreateTrigger>>();

  // Run scheduled responses
  auto performTime = scene.getPerformTime();
  scheduled.erase(std::remove_if(scheduled.begin(), scheduled.end(),
                      [&](Thread &thread) {
                        if (performTime >= thread.scheduledPerformTime) {
                          current.push_back(std::move(thread));
                          return true;
                        }
                        return false;
                      }),
      scheduled.end());
  for (auto &thread : current) {
    thread.response->runChain(thread.ctx);
  }
  current.clear();
}
