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
#ifdef __EMSCRIPTEN__ // Text actors only work on web for now
  if (!hasAnyEnabledComponent()) {
    return; // Skip logic if no components
  }

  auto &rulesBehavior = getBehaviors().byType<RulesBehavior>();
  while (true) {
    if (auto actorIdInt = JS_getClickedTextActorId(); actorIdInt > 0) {
      auto actorId = ActorId(actorIdInt);
      if (auto component = maybeGetComponent(actorId); component && !component->disabled) {
        rulesBehavior.fire<TextTapTrigger>(actorId, {});
      }
    } else {
      break;
    }
  }

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

  auto output = archive.toJson();
  JS_updateTextActors(output.c_str(), output.length());
#endif
}
