#pragma once

#include "precomp.h"

#include "behaviors/base.h"
#include "props.h"
#include "token_map.h"


//
// Tag
//

struct TagsMapElem {
  // Used internally by `TagsBehavior` as an element in the tag -> actors map. Defined first and at
  // top-level because `TagsComponent` depends on `Tag` depends on `TagsMap` depends on this.

  SmallVector<ActorId, 4> actorIds;
};
using TagsMap = TokenMap<TagsMapElem>;

struct Tag {
  // For storing tag references at runtime (eg. in rule elements or other behaviors). Enables fast
  // lookups and deduplicates string data.

  bool operator==(const Tag &other) const;

private:
  friend class TagsBehavior;

  TagsMap::Token token;

  explicit Tag(TagsMap::Token token_);
};

using TagVector = SmallVector<Tag, 4>; // For storing multiple tags


//
// Behavior
//

struct TagsComponent : BaseComponent {
  struct Props {
    PROP(std::string, tagsString); // Single string of all tags separated by whitespace
  } props;

  TagVector tags;
};

class TagsBehavior : public BaseBehavior<TagsBehavior, TagsComponent> {
public:
  static constexpr auto name = "Tags";
  static constexpr auto behaviorId = 7;

  using BaseBehavior::BaseBehavior;


  void handleEnableComponent(ActorId actorId, TagsComponent &component);
  void handleDisableComponent(ActorId actorId, TagsComponent &component, bool removeActor);


  // string <-> `Tag`

  Tag getTag(const char *str); // Get tag from string with exact single tag (no whitespace)
  TagVector parseTags(const char *str); // Get from string with space-separated words -- also dedups


  // `ActorId` <-> `Tag`

  bool hasTag(ActorId actorId, Tag tag) const;
  const TagVector &getTags(ActorId actorId) const;
  template<typename F>
  void forEachActorWithTag(Tag tag, F &&f) const; // `f` takes `(ActorId)`


private:
  friend struct BasicTagsTest; // Test accesses our components directly -- may remove that later

  TagsMap map;
};


// Inlined implementations

inline bool Tag::operator==(const Tag &other) const {
  return token == other.token;
}

inline Tag::Tag(TagsMap::Token token_)
    : token(token_) {
}

inline Tag TagsBehavior::getTag(const char *str) {
  return Tag(map.getToken(str));
}

inline TagVector TagsBehavior::parseTags(const char *str) {
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

    // Add tag from this word if not already added
    std::string word(start, end - start);
    auto tag = getTag(word.c_str());
    if (std::find(result.begin(), result.end(), tag) == result.end()) {
      result.push_back(tag);
    }

    // Continue at end of this word
    start = end;
  }
  return result;
}

inline bool TagsBehavior::hasTag(ActorId actorId, Tag tag) const {
  if (auto component = maybeGetComponent(actorId)) {
    auto &tags = component->tags;
    return std::find(tags.begin(), tags.end(), tag) != tags.end();
  } else {
    return false;
  }
}

inline const TagVector &TagsBehavior::getTags(ActorId actorId) const {
  if (auto component = maybeGetComponent(actorId)) {
    return component->tags;
  } else {
    static TagVector empty;
    return empty;
  }
}

template<typename F>
inline void TagsBehavior::forEachActorWithTag(Tag tag, F &&f) const {
  if (auto elem = map.lookup(tag.token)) {
    for (auto actorId : elem->actorIds) {
      f(actorId);
    }
  }
}
