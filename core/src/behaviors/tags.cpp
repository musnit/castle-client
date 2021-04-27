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
    if (elem) { // This should always pass
      elem->actorIds.push_back(actorId); // NOTE: We're assuming it's not already there because the
                                         //       component is just being enabled now
    }
  }
}

void TagsBehavior::handleDisableComponent(
    ActorId actorId, TagsComponent &component, bool removeActor) {
  // Remove from map for each tag
  for (auto tag : component.tags) {
    if (auto elem = map.lookup(tag.token)) { // This should always pass
      // TODO(nikki): We do a linear-time scan to remove here, use some kind of sparse set instead?
      //              Let's get all the functionality working first before doing that though...
      auto &actorIds = elem->actorIds;
      actorIds.erase(std::remove(actorIds.begin(), actorIds.end(), actorId), actorIds.end());
    }
  }
}
