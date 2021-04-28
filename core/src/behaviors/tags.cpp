#include "tags.h"

#include "behaviors/all.h"


//
// Tag reading
//

void Tag::read(Reader &reader) {
  if (auto scene = reader.getScene()) {
    if (auto str = reader.str()) {
      auto &tagsBehavior = scene->getBehaviors().byType<TagsBehavior>();
      *this = tagsBehavior.getTag(*str);
    }
  }
}

TagVector TagsBehavior::parseTags(const char *str) {
  TagVector result;
  for (const char *start = str; *start != '\0';) { // Search for words
    // Skip whitespace
    while (*start != '\0' && std::isspace(*start)) {
      ++start;
    }
    if (*start == '\0') {
      break; // Hit end of string
    }

    // Find end of word
    const char *end = start;
    while (*end != '\0' && !std::isspace(*end)) {
      ++end;
    }

    // Add tag from this word if not already added. We construct a `Tag` directly here and don't use
    // `getTag` to avoid the copy.
    std::string word(start, end - start);
    for (auto &c : word) {
      c = std::tolower(c);
    }
    Tag tag(map.getToken(word.c_str()));
    if (std::find(result.begin(), result.end(), tag) == result.end()) {
      result.push_back(tag);
    }

    // Continue at end of this word
    start = end;
  }
  return result;
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
