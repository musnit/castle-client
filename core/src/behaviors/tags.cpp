#include "tags.h"

#include "behaviors/all.h"

//
// Tag serialization
//

void Tag::write(Writer &writer) const {
  auto written = false;
  if (auto scene = writer.getScene()) {
    auto &tagsBehavior = scene->getBehaviors().byType<TagsBehavior>();
    if (auto result = tagsBehavior.getString(*this)) {
      writer.setStr(*result);
      written = true;
    }
  }
  if (!written) {
    writer.setStr("");
  }
}

//
// Tag reference reading
//

void Tag::read(Reader &reader) {
  if (auto str = reader.str(); str && (*str)[0] != '\0') { // Empty string is empty tag
    if (auto scene = reader.getScene()) {
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

    // Add tag from this word if not already added.
    std::string word(start, end - start);
    for (auto &c : word) {
      c = std::tolower(c);
    }
    auto tag = getTagAlreadyLowercase(word.c_str());
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

  void write(Writer &writer) const {
    std::stringstream ss;
    if (auto scene = writer.getScene()) {
      auto &tagsBehavior = scene->getBehaviors().byType<TagsBehavior>();
      for (auto &tag : vec) {
        if (auto result = tagsBehavior.getString(tag)) {
          if (ss.gcount() > 0) {
            ss << " ";
          }
          ss << *result;
        }
      }
    }
    writer.setStr(ss.str());
  }

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
// Triggers
//

struct GainTagTrigger : BaseTrigger {
  inline static const RuleRegistration<GainTagTrigger, TagsBehavior> registration { "gain tag" };
  static constexpr auto description = "When this gains a tag";

  struct Params {
    PROP(Tag, tag);
  } params;
};

struct LoseTagTrigger : BaseTrigger {
  inline static const RuleRegistration<LoseTagTrigger, TagsBehavior> registration { "lose tag" };
  static constexpr auto description = "When this loses a tag";

  struct Params {
    PROP(Tag, tag);
  } params;
};


//
// Responses
//

struct AddTagResponse : BaseResponse {
  inline static const RuleRegistration<AddTagResponse, TagsBehavior> registration { "add tag" };
  static constexpr auto description = "Add tags to this actor";

  struct Params {
    PROP(ReadableTagVector, tag);
  } params;

  void run(RuleContext &ctx) override {
    auto actorId = ctx.actorId;
    auto &tagsBehavior = ctx.getScene().getBehaviors().byType<TagsBehavior>();
    auto &rulesBehavior = ctx.getScene().getBehaviors().byType<RulesBehavior>();
    if (auto component = tagsBehavior.maybeGetComponent(actorId)) {
      auto &tags = component->tags;
      for (auto tag : params.tag().vec) {
        if (std::find(tags.begin(), tags.end(), tag) == tags.end()) {
          tags.push_back(tag);
          tagsBehavior.addToMap(actorId, tag);
          rulesBehavior.fireIf<GainTagTrigger>(actorId, {}, [&](const GainTagTrigger &trigger) {
            auto triggerTag = trigger.params.tag();
            return triggerTag == emptyTag || triggerTag == tag;
          });
        }
      }
    }
  }
};

struct RemoveTagResponse : BaseResponse {
  inline static const RuleRegistration<RemoveTagResponse, TagsBehavior> registration {
    "remove tag"
  };
  static constexpr auto description = "Remove tags from this actor";

  struct Params {
    PROP(ReadableTagVector, tag);
  } params;

  void run(RuleContext &ctx) override {
    auto actorId = ctx.actorId;
    auto &tagsBehavior = ctx.getScene().getBehaviors().byType<TagsBehavior>();
    auto &paramsTags = params.tag().vec;
    auto &rulesBehavior = ctx.getScene().getBehaviors().byType<RulesBehavior>();
    if (auto component = tagsBehavior.maybeGetComponent(actorId)) {
      // Iterate through existing tags, removing tags that are in `paramsTags` -- also updating our
      // tag -> actors maps and firing triggers
      auto &tags = component->tags;
      tags.erase(
          std::remove_if(tags.begin(), tags.end(),
              [&](Tag tag) {
                if (std::find(paramsTags.begin(), paramsTags.end(), tag) != paramsTags.end()) {
                  tagsBehavior.removeFromMap(actorId, tag);
                  rulesBehavior.fireIf<LoseTagTrigger>(
                      actorId, {}, [&](const LoseTagTrigger &trigger) {
                        auto triggerTag = trigger.params.tag();
                        return triggerTag == emptyTag || triggerTag == tag;
                      });
                  return true;
                }
                return false;
              }),
          tags.end());
    }
  }
};

struct HasTagResponse : BaseResponse {
  inline static const RuleRegistration<HasTagResponse, TagsBehavior> registration { "has tag" };
  static constexpr auto description = "If this has a tag";

  struct Params {
    PROP(Tag, tag);
  } params;

  bool eval(RuleContext &ctx) override {
    auto &tagsBehavior = ctx.getScene().getBehaviors().byType<TagsBehavior>();
    return tagsBehavior.hasTag(ctx.actorId, params.tag());
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
// Handle set property
//

void TagsBehavior::handleSetProperty(
    ActorId actorId, TagsComponent &component, PropId propId, const ExpressionValue &value) {
  auto &props = component.props;
  if (propId == props.tagsString.id) {
    // clear old tags
    for (auto tag : component.tags) {
      removeFromMap(actorId, tag);
    }

    // add new tags
    if (value.is<const char *>()) {
      component.tags = parseTags(value.as<const char *>());
      for (auto tag : component.tags) {
        addToMap(actorId, tag);
      }
    }
  }
  BaseBehavior::handleSetProperty(actorId, component, propId, value);
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
