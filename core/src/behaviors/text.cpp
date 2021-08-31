#include "text.h"

#include "behaviors/all.h"
#include "archive.h"
#include "js.h"
#include "engine.h"


//
// Web bindings
//

JS_DEFINE(int, JS_updateTextActors, (const char *msg, int msgLen), {
  if (Castle.updateTextActors) {
    Castle.updateTextActors(UTF8ToString(msg, msgLen));
  }
});

JS_DEFINE(int, JS_getClickedTextActorId, (), {
  if (Castle.clickedTextActorIdsQueue.length > 0) {
    return Castle.clickedTextActorIdsQueue.shift();
  } else {
    return -1;
  }
});

JS_DEFINE(int, JS_navigateToCardId, (const char *cardId, int cardIdLen),
    { Castle.navigateToCardId(UTF8ToString(cardId, cardIdLen)); });

// JS_DEFINE(int, JS_preloadCardId, (const char *cardId, int cardIdLen),
//    { Castle.preloadCardId(UTF8ToString(cardId, cardIdLen)); });

//
// React native bindings
//

struct SelectActorReceiver {
  inline static const BridgeRegistration<SelectActorReceiver> registration { "SELECT_ACTOR" };

  struct Params {
    PROP(int, actorId) = -1;
  } params;

  void receive(Engine &engine) {
    if (!engine.getIsEditing()) {
      auto &textBehavior = engine.getScene().getBehaviors().byType<TextBehavior>();
      textBehavior.clickedTextActorIdsQueue.push(params.actorId());
    }
  }
};


//
// Triggers
//

struct TextTapTrigger : BaseTrigger {
  inline static const RuleRegistration<TextTapTrigger, TextBehavior> registration { "tap" };
  static constexpr auto description = "When this is tapped";

  struct Params {
  } params;
};


//
// Responses
//

struct Card {
  Card() = default;

  void read(Reader &reader) {
    title = reader.str("title", "");
    cardId = reader.str("cardId", "");
    // JS_preloadCardId(cardId.c_str(), cardId.size());
  }

  std::string title;
  std::string cardId;
};

struct SendPlayerToCardResponse : BaseResponse {
  inline static const RuleRegistration<SendPlayerToCardResponse, TextBehavior> registration {
    "send player to card"
  };
  static constexpr auto description = "Send player to a different card";

  struct Params {
    PROP(Card, card, .label("destination card"));
  } params;

  void run(RuleContext &ctx) override {
#ifdef __EMSCRIPTEN__
    JS_navigateToCardId(params.card().cardId.c_str(), params.card().cardId.length());
#else
    ctx.getScene().setNextCardId(params.card().cardId);
#endif
  }
};

struct ShowResponse : BaseResponse {
  inline static const RuleRegistration<ShowResponse, TextBehavior> registration { "show" };
  static constexpr auto description = "Show this text (legacy)";

  struct Params {
  } params;

  void run(RuleContext &ctx) override {
    auto &textBehavior = ctx.getScene().getBehaviors().byType<TextBehavior>();
    if (auto component = textBehavior.maybeGetComponent(ctx.actorId)) {
      component->props.visible() = true;
    }
  }
};

struct HideResponse : BaseResponse {
  inline static const RuleRegistration<HideResponse, TextBehavior> registration { "hide" };
  static constexpr auto description = "Hide this text (legacy)";

  struct Params {
  } params;

  void run(RuleContext &ctx) override {
    auto &textBehavior = ctx.getScene().getBehaviors().byType<TextBehavior>();
    if (auto component = textBehavior.maybeGetComponent(ctx.actorId)) {
      component->props.visible() = false;
    }
  }
};


//
// Read, write
//

void TextBehavior::handleReadComponent(ActorId actorId, TextComponent &component, Reader &reader) {
  if (component.props.order() == -1) {
    int maxExistingOrder = 0;

    forEachComponent([&](ActorId actorId, TextComponent &component) {
      if (component.props.order() >= maxExistingOrder) {
        maxExistingOrder = component.props.order();
      }
    });

    component.props.order() = maxExistingOrder + 1;
  }
}


//
// Perform
//

void TextBehavior::handlePerform(double dt) {
  auto &rulesBehavior = getBehaviors().byType<RulesBehavior>();
  while (true) {
#ifdef __EMSCRIPTEN__
    if (auto actorIdInt = JS_getClickedTextActorId(); actorIdInt >= 0) {
#else
    if (!clickedTextActorIdsQueue.empty()) {
      auto actorIdInt = clickedTextActorIdsQueue.front();
      clickedTextActorIdsQueue.pop();
#endif
      auto actorId = ActorId(actorIdInt);
      if (auto component = maybeGetComponent(actorId); component && !component->disabled) {
        rulesBehavior.fire<TextTapTrigger>(actorId, {});
      }
    } else {
      break;
    }
  }

  maybeSendBridgeData();
}

//
// Data
//

struct TextActorsDataEvent {
  PROP(std::string, data) = "";
};

bool TextBehavior::hasTapTrigger(ActorId actorId) {
  auto &rulesBehavior = getBehaviors().byType<RulesBehavior>();
  if (getScene().getIsEditing()) {
    // can't query `rulesBehavior.hasTrigger` because we don't build trigger components at edit-time
    if (auto component = rulesBehavior.maybeGetComponent(actorId); component) {
      Reader reader(component->editData->value);
      auto found = false;
      reader.each("rules", [&]() {
        reader.obj("trigger", [&]() {
          if (auto nameCStr = reader.str("name", "")) {
            if (auto behaviorId = reader.num("behaviorId", -1)) {
              if (std::strcmp(nameCStr, "tap") == 0
                  && (int)behaviorId == TextBehavior::behaviorId) {
                found = true;
              }
            }
          }
        });
      });
      return found;
    }
  } else {
    return rulesBehavior.hasTrigger<TextTapTrigger>(actorId);
  }
  return false;
}

void TextBehavior::maybeSendBridgeData() {
  Archive archive;
  archive.write([&](Archive::Writer &writer) {
    writer.arr("textActors", [&]() {
      forEachEnabledComponent([&](ActorId actorId, TextComponent &component) {
        if (!getScene().isGhost(actorId)) {
          writer.obj([&]() {
            writer.num("actorId", (int)entt::to_integral(actorId));
            writer.str("content", formatContent(component.props.content()));
            writer.num("order", component.props.order());
            writer.boolean("hasTapTrigger", hasTapTrigger(actorId));
            writer.boolean("visible", component.props.visible());
          });
        }
      });
    });
  });

  auto output = archive.toJson();
  if (lastDataSent.compare(output) != 0) {
#ifdef __EMSCRIPTEN__
    JS_updateTextActors(output.c_str(), output.length());
#else
    TextActorsDataEvent textActorsData;
    textActorsData.data = output;
    getScene().getBridge().sendEvent("TEXT_ACTORS_DATA", textActorsData);
#endif
    lastDataSent = output;
  }
}

//
// Content formatting
//

std::string TextBehavior::formatContent(const std::string &content) const {
  std::string result;
  static std::regex re("\\$([a-zA-Z0-9_-]+)");
  auto it = content.begin(), end = content.end();
  auto &variables = getScene().getVariables();
  for (std::smatch match; std::regex_search(it, end, match, re); it = match[0].second) {
    result += match.prefix();
    auto name = match.str(1);
    if (auto value = variables.get(name)) {
      // We want to remove trailing zeros and show at most 5 digits after the decimal point.
      // `.5f` keeps trailing zeros, while `.5g` counts digits before the decimal point. So we need
      // to work around this...
      auto str = fmt::format("{:.5f}", value->as<double>());
      if (!str.empty()) {
        auto strip = int(str.size() - 1);
        while (strip > 0 && str[strip] == '0') {
          --strip;
        }
        if (strip > 0 && str[strip] == '.') {
          --strip;
        }
        result += str.substr(0, strip + 1);
      }
    } else {
      result += '$';
      result += name;
    }
  }
  result.append(it, end);
  return result;
}
