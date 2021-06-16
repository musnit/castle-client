#include "text.h"

#include "behaviors/all.h"
#include "archive.h"
#include "js.h"


//
// JavaScript bindings
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
// Triggers
//

struct TextTapTrigger : BaseTrigger {
  inline static const RuleRegistration<TextTapTrigger, TextBehavior> registration { "tap" };

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

  struct Params {
    PROP(Card, card);
  } params;

  void run(RuleContext &ctx) override {
    JS_navigateToCardId(params.card().cardId.c_str(), params.card().cardId.length());
  }
};

struct ShowResponse : BaseResponse {
  inline static const RuleRegistration<ShowResponse, TextBehavior> registration { "show" };

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
#ifdef __EMSCRIPTEN__
  auto &rulesBehavior = getBehaviors().byType<RulesBehavior>();
  while (true) {
    if (auto actorIdInt = JS_getClickedTextActorId(); actorIdInt >= 0) {
      auto actorId = ActorId(actorIdInt);
      if (auto component = maybeGetComponent(actorId); component && !component->disabled) {
        rulesBehavior.fire<TextTapTrigger>(actorId, {});
      }
    } else {
      break;
    }
  }
#endif

  maybeSendBridgeData();
}

//
// Data
//

struct TextActorsDataEvent {
  PROP(std::string, data) = "";
};

void TextBehavior::maybeSendBridgeData() {
  auto &rulesBehavior = getBehaviors().byType<RulesBehavior>();
  
  Archive archive;
  archive.write([&](Archive::Writer &writer) {
    writer.arr("textActors", [&]() {
      forEachEnabledComponent([&](ActorId actorId, TextComponent &component) {
        writer.obj([&]() {
          writer.num("actorId", (int)entt::to_integral(actorId));
          writer.str("content", formatContent(component.props.content()));
          writer.num("order", component.props.order());
          writer.boolean("hasTapTrigger", rulesBehavior.hasTrigger<TextTapTrigger>(actorId));
          writer.boolean("visible", component.props.visible());
        });
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
