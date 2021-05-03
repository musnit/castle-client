#include "text.h"

#include "behaviors/all.h"
#include "archive.h"
#include "js.h"

JS_DEFINE(int, JS_updateTextActors, (const char *msg, int lenmsg), {
  if (Castle.updateTextActors) {
    Castle.updateTextActors(UTF8ToString(msg, lenmsg));
  }
});

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

  Archive archive;
  archive.write([&](Archive::Writer &w) {
    w.arr("textActors", [&]() {
      forEachEnabledComponent([&](ActorId actorId, TextComponent &component) {
        w.obj([&]() {
          w.str("content", component.props.content());
          w.num("order", component.props.order());
        });
      });
    });
  });


  std::string output = archive.toJson();
  JS_updateTextActors(output.c_str(), output.length());
}
