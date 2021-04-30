#include "text.h"

#include "behaviors/all.h"
#include "archive.h"
#include "js.h"

JS_DEFINE(int, JS_updateTextActors, (const char *msg, int lenmsg),
    { Castle.updateTextActors(UTF8ToString(msg, lenmsg)) });

//
// Read, write
//

void TextBehavior::handleReadComponent(ActorId actorId, TextComponent &component, Reader &reader) {
  if (component.props.order() == -1) {
  }
}

//
// Perform
//

void TextBehavior::handlePerform(double dt) {
  if (!hasAnyEnabledComponent()) {
    return; // Skip gesture logic if no components
  }

  Archive archive;
  archive.write([&](Archive::Writer &w) {
    w.arr("textActors", [&]() {
      forEachEnabledComponent([&](ActorId actorId, TextComponent &component) {
        w.str(component.props.content());
      });
    });
  });


  std::string output = archive.toJson();
  JS_updateTextActors(output.c_str(), output.length());
}
