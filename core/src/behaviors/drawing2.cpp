#include "drawing2.h"

#include "behaviors/all.h"


//
// Read, write
//

void Drawing2Behavior::handleReadComponent(
    ActorId actorId, Drawing2Component &component, Reader &reader) {
  reader.obj("drawData", [&]() {
    component.drawData = std::make_unique<love::DrawData>(reader);
  });
}


//
// Draw
//

void Drawing2Behavior::handleDrawComponent(
    ActorId actorId, const Drawing2Component &component) const {
  if (component.drawData) {
    lv.graphics.push();

    lv.graphics.setColor(love::Colorf(1, 1, 1, 1));
    component.drawData->render(std::nullopt);

    lv.graphics.pop();
  }
}
