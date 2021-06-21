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

  ActorIdSet actorIds;
};

using TagsMap = TokenMap<TagsMapElem>; // Used by `TagsBehavior` as tag -> actors map

struct Tag {
  // For storing tag references at runtime (eg. in rule elements or other behaviors). Enables fast
  // lookups and deduplicates string data.

  Tag() = default; // To allow default construction when reading

  bool operator==(const Tag &other) const;

  void read(Reader &reader);

private:
  friend class TagsBehavior;

  TagsMap::Token token;

  explicit Tag(TagsMap::Token token_);
};

constexpr Tag emptyTag; // Compare with this to check if it's the default / empty tag

using TagVector = SmallVector<Tag, 4>; // For storing multiple tags


//
// Behavior
//

struct TagsComponent : BaseComponent {
  struct Props {
    PROP(
         std::string, tagsString,
         .label("tags")
         ); // Single string of all tags separated by whitespace
  } props;

  TagVector tags;
};

class TagsBehavior : public BaseBehavior<TagsBehavior, TagsComponent> {
public:
  static constexpr auto name = "Tags";
  static constexpr auto behaviorId = 17;
  static constexpr auto displayName = "Tags";

  using BaseBehavior::BaseBehavior;


  void handleEnableComponent(ActorId actorId, TagsComponent &component);
  void handleDisableComponent(ActorId actorId, TagsComponent &component, bool removeActor);


  // string <-> `Tag`

  Tag getTag(const char *str); // Get tag from string with exact single tag, case insensitive
  Tag getTagAlreadyLowercase(const char *str); // Like above but case sensitive (lowercase expected)
  TagVector parseTags(const char *str); // Get from string with space-separated words -- also dedups
  const std::string *getString(Tag tag); // Get string from tag -- `nullptr` if unrecognized


  // `ActorId` <-> `Tag`

  bool hasTag(ActorId actorId, Tag tag) const;
  const TagVector &getTags(ActorId actorId) const; // Direct short-lived view of underlying vector
  template<typename F>
  void forEachActorWithTag(Tag tag, F &&f) const; // `f` takes `(ActorId)`
  int numActorsWithTag(Tag tag) const;
  ActorId indexActorWithTag(Tag tag, int index); // Order maintained as long as actors / tags not
                                                 // added / removed. `nullActor` if out of bounds.


private:
  friend struct AddTagResponse;
  friend struct RemoveTagResponse;
  friend struct BasicTagsTest; // Test accesses our components directly -- may remove that later

  TagsMap map;


  // Only updates in map, doesn't update the component
  void addToMap(ActorId actorId, Tag tag);
  void removeFromMap(ActorId actorId, Tag tag);
};


// Inlined implementations

inline bool Tag::operator==(const Tag &other) const {
  return token == other.token;
}

inline Tag::Tag(TagsMap::Token token_)
    : token(token_) {
}

inline Tag TagsBehavior::getTag(const char *str) {
  std::string lower(str);
  for (auto &c : lower) {
    c = std::tolower(c);
  }
  return getTagAlreadyLowercase(lower.c_str());
}

inline Tag TagsBehavior::getTagAlreadyLowercase(const char *str) {
  return Tag(map.getToken(str));
}

inline const std::string *TagsBehavior::getString(Tag tag) {
  return map.getString(tag.token);
}

inline bool TagsBehavior::hasTag(ActorId actorId, Tag tag) const {
  if (tag == emptyTag) {
    return true;
  }
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
void TagsBehavior::forEachActorWithTag(Tag tag, F &&f) const {
  if (tag == emptyTag) {
    getScene().forEachActor([&](ActorId actorId) {
      f(actorId);
    });
  } else {
    if (auto elem = map.lookup(tag.token)) {
      for (auto actorId : elem->actorIds) {
        f(actorId);
      }
    }
  }
}

inline int TagsBehavior::numActorsWithTag(Tag tag) const {
  if (tag == emptyTag) {
    return getScene().numActors();
  } else {
    if (auto elem = map.lookup(tag.token)) {
      return elem->actorIds.size();
    } else {
      return 0;
    }
  }
}

inline ActorId TagsBehavior::indexActorWithTag(Tag tag, int index) {
  if (index < 0) {
    return nullActor;
  }
  if (tag == emptyTag) {
    return getScene().indexActor(index);
  } else {
    if (auto elem = map.lookup(tag.token); index < int(elem->actorIds.size())) {
      return elem->actorIds.data()[index];
    } else {
      return nullActor;
    }
  }
}
