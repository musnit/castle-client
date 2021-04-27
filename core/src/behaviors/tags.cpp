#include "tags.h"

#include "behaviors/all.h"


//
// Tag reading
//

void Tag::read(Reader &reader) {
  if (auto maybeScene = reader.getScene()) {
    if (auto maybeStr = reader.str()) {
      auto &tagsBehavior = maybeScene->getBehaviors().byType<TagsBehavior>();
      *this = tagsBehavior.getTag(*maybeStr);
    }
  }
}


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
    if (elem) { // Should always pass because we inserted above if not present
      auto &actorIds = elem->actorIds;
      if (!actorIds.contains(actorId)) { // Should also always pass, but just making sure
        actorIds.emplace(actorId);
      }
    }
  }
}

void TagsBehavior::handleDisableComponent(
    ActorId actorId, TagsComponent &component, bool removeActor) {
  // Remove from map for each tag
  for (auto tag : component.tags) {
    if (auto elem = map.lookup(tag.token)) { // Should always pass
      auto &actorIds = elem->actorIds;
      if (actorIds.contains(actorId)) { // Should also always pass, but just making sure
        actorIds.remove(actorId);
      }
    }
  }
}
