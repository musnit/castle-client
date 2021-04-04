#include "drawing2.h"

#include "behaviors/all.h"


void Drawing2Behavior::handleEnableComponent(ActorId actorId, Drawing2Component &component) {
  fmt::print("here '{}'\n", component.props.drawData());
  Archive2 archive = Archive2::fromString(component.props.drawData().c_str());
  archive.read([&](Archive2::Reader &r) {
    component.drawData = std::make_unique<love::DrawData>(r);
  });
}

//
// Draw
//


void Drawing2Behavior::handleDrawComponent(
    ActorId actorId, const Drawing2Component &component) const {
  if (component.drawData) {
    lv.graphics.push();

    love::Colorf color;
    color.r = 1.0;
    color.g = 1.0;
    color.b = 1.0;
    color.a = 1.0;
    lv.graphics.setColor(color);

    component.drawData->render(std::nullopt);

    lv.graphics.pop();
  }
}
