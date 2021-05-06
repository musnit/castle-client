#include "tags.h"

#include "behaviors/all.h"


//
// Tag reference reading
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

struct ReadableTagVector {
  TagVector vec;

  void read(Reader &reader) {
    if (auto scene = reader.getScene()) {
      if (auto str = reader.str()) {
        auto &tagsBehavior = scene->getBehaviors().byType<TagsBehavior>();
        vec = tagsBehavior.parseTags(*str);
      }
    }
  }
};


//
// Responses
//

struct AddTagResponse : BaseResponse {
  inline static const RuleRegistration<AddTagResponse, TagsBehavior> registration { "add tag" };

  struct Params {
    PROP(ReadableTagVector, tag);
  } params;

  void run(RuleContext &ctx) override {
    auto actorId = ctx.actorId;
    auto &tagsBehavior = ctx.getScene().getBehaviors().byType<TagsBehavior>();
    if (auto component = tagsBehavior.maybeGetComponent(actorId)) {
      auto &tags = component->tags;
      for (auto tag : params.tag().vec) {
        if (std::find(tags.begin(), tags.end(), tag) == tags.end()) {
          tags.push_back(tag);
          tagsBehavior.addToMap(actorId, tag);
        }
      }
    }
  }
};

struct RemoveTagResponse : BaseResponse {
  inline static const RuleRegistration<RemoveTagResponse, TagsBehavior> registration {
    "remove tag"
  };

  struct Params {
    PROP(ReadableTagVector, tag);
  } params;

  void run(RuleContext &ctx) override {
    auto actorId = ctx.actorId;
    auto &tagsBehavior = ctx.getScene().getBehaviors().byType<TagsBehavior>();
    auto &paramsTags = params.tag().vec;
    if (auto component = tagsBehavior.maybeGetComponent(actorId)) {
      auto &tags = component->tags;
      tags.erase(
          std::remove_if(tags.begin(), tags.end(),
              [&](Tag tag) {
                if (std::find(paramsTags.begin(), paramsTags.end(), tag) != paramsTags.end()) {
                  tagsBehavior.removeFromMap(actorId, tag);
                  return true;
                }
                return false;
              }),
          tags.end());
    }
  }
};


//
// Enable, disable
//

void TagsBehavior::handleEnableComponent(ActorId actorId, TagsComponent &component) {
  component.tags = parseTags(component.props.tagsString().c_str());
  for (auto tag : component.tags) {
    addToMap(actorId, tag);
  }
}

void TagsBehavior::handleDisableComponent(
    ActorId actorId, TagsComponent &component, bool removeActor) {
  for (auto tag : component.tags) {
    removeFromMap(actorId, tag);
  }
}


//
// Add, remove tags
//

void TagsBehavior::addToMap(ActorId actorId, Tag tag) {
  auto elem = map.lookup(tag.token);
  if (!elem) {
    map.insert(tag.token, {});
    elem = map.lookup(tag.token);
  }
  if (elem) { // Just added above if not present so should pass
    if (auto &actorIds = elem->actorIds; !actorIds.contains(actorId)) {
      actorIds.emplace(actorId);
    }
  }
}

void TagsBehavior::removeFromMap(ActorId actorId, Tag tag) {
  if (auto elem = map.lookup(tag.token)) {
    if (auto &actorIds = elem->actorIds; actorIds.contains(actorId)) {
      actorIds.remove(actorId);
    }
  }
}
