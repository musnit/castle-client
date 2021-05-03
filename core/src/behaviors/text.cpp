#include "text.h"

#include "behaviors/all.h"
#include "archive.h"
#include "js.h"

JS_DEFINE(int, JS_updateTextActors, (const char *msg, int lenmsg), {
  if (Castle.updateTextActors) {
    Castle.updateTextActors(UTF8ToString(msg, lenmsg));
  }
});

JS_DEFINE(int, JS_getClickedTextActorId, (), {
  if (Castle.clickedTextActorIdsQueue.length > 0) {
    return Castle.clickedTextActorIdsQueue.shift();
  } else {
    return -1;
  }
});

JS_DEFINE(int, JS_navigateToCard, (const char *msg, int lenmsg),
    { Castle.navigateToCardId(UTF8ToString(msg, lenmsg)); });

JS_DEFINE(int, JS_preloadCard, (const char *msg, int lenmsg),
    { Castle.preloadCardId(UTF8ToString(msg, lenmsg)); });

struct TextTapTrigger : BaseTrigger {
  inline static const RuleRegistration<TextTapTrigger, TextBehavior> registration { "tap" };

  struct Params {
  } params;
};

struct Card {
  Card() = default;

  void read(Reader &reader) {
    title = reader.str("title", "");
    cardId = reader.str("cardId", "");

    JS_preloadCard(cardId.c_str(), cardId.length());
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
    JS_navigateToCard(params.card().cardId.c_str(), params.card().cardId.length());
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
  if (!hasAnyEnabledComponent()) {
    return; // Skip logic if no components
  }

  auto &rulesBehavior = getBehaviors().byType<RulesBehavior>();

  std::set<int> clickedTextActorIds;
  while (true) {
    int clickedTextActorId = JS_getClickedTextActorId();
    if (clickedTextActorId < 0) {
      break;
    } else {
      clickedTextActorIds.insert(clickedTextActorId);
    }
  }

  forEachEnabledComponent([&](ActorId actorId, TextComponent &component) {
    if (clickedTextActorIds.find((int)entt::to_integral(actorId)) != clickedTextActorIds.end()) {
      rulesBehavior.fire<TextTapTrigger>(actorId, {});
    }
  });

  Archive archive;
  archive.write([&](Archive::Writer &w) {
    w.arr("textActors", [&]() {
      forEachEnabledComponent([&](ActorId actorId, TextComponent &component) {
        w.obj([&]() {
          w.num("actorId", (int)entt::to_integral(actorId));
          w.str("content", component.props.content());
          w.num("order", component.props.order());
          w.boolean("hasTapTrigger", rulesBehavior.hasTrigger<TextTapTrigger>(actorId));
        });
      });
    });
  });


  std::string output = archive.toJson();
  JS_updateTextActors(output.c_str(), output.length());
}
