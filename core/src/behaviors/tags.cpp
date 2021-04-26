#include "tags.h"

#include "behaviors/all.h"


//
// Enable, disable
//

void TagsBehavior::handleEnableComponent(ActorId actorId, TagsComponent &component) {
  // Parse tags
  component.tags = parseTags(component.props.tagsString().c_str());

  // Add to map for each tag
  for (auto tag : component.tags) {
    auto elem = map.lookup(tag.token);
    if (!elem) {
      map.insert(tag.token, {});
      elem = map.lookup(tag.token);
    }
    if (elem) { // This should always pass
      auto &actorIds = elem->actorIds;
      if (std::find(actorIds.begin(), actorIds.end(), actorId) == actorIds.end()) {
        elem->actorIds.push_back(actorId);
      }
    }
  }
}

void TagsBehavior::handleDisableComponent(
    ActorId actorId, TagsComponent &component, bool removeActor) {
  // Remove from map for each tag
  for (auto tag : component.tags) {
    if (auto elem = map.lookup(tag.token)) { // This should always pass
      auto &actorIds = elem->actorIds;
      actorIds.erase(std::remove(actorIds.begin(), actorIds.end(), actorId), actorIds.end());
    }
  }
}
