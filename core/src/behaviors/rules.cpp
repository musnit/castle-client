#include "rules.h"

#include "behaviors/all.h"


//
// Triggers
//

struct CreateTrigger : BaseTrigger {
  inline static const RuleRegistration<CreateTrigger> registration { "create", 16 };

  struct Params {
  } params;
};


//
// Responses
//


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
    // Read trigger
    reader.obj("trigger", [&]() {
      if (auto maybeName = reader.str("name")) {
        if (auto maybeBehaviorId = reader.num("behaviorId")) {
          auto nameHash = entt::hashed_string(*maybeName).value();
          for (auto &loader : triggerLoaders) {
            if (loader.behaviorId == *maybeBehaviorId && nameHash == loader.nameHs.value()
                && !std::strcmp(*maybeName, loader.nameHs.data())) {
              loader.read(getScene(), actorId, reader);
              break;
            }
          }
        }
      }
    });
  });
}


//
// Perform
//

void RulesBehavior::handlePerform(double dt) {
  auto &registry = getScene().getEntityRegistry();

  // Fire create triggers and clear them
  registry.view<TriggerComponent<CreateTrigger>>().each(
      [&](ActorId actorId, TriggerComponent<CreateTrigger> &component) {
        for (auto &entry : component.entries) {
          fmt::print("firing create trigger on {}\n", entt::to_integral(actorId));
        }
      });
  registry.clear<TriggerComponent<CreateTrigger>>();
}
