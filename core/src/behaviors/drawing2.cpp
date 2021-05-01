#include "drawing2.h"

#include "behaviors/all.h"


//
// Read, write
//

void Drawing2Behavior::handleReadComponent(
    ActorId actorId, Drawing2Component &component, Reader &reader) {
  component.hash = reader.str("hash", "");

  component.animationComponentProperties.read(reader);

  if (auto found = drawDataCache.find(component.hash); found == drawDataCache.end()) {
    reader.obj("drawData", [&]() {
      drawDataCache.insert_or_assign(component.hash, std::make_shared<love::DrawData>(reader));
    });
  }

  component.drawData = drawDataCache.find(component.hash)->second;
}

//
// Perform
//

void Drawing2Behavior::handlePerform(double dt) {
  if (!hasAnyEnabledComponent()) {
    return; // Skip gesture logic if no components
  }

  forEachEnabledComponent([&](ActorId actorId, Drawing2Component &component) {
    component.drawData->runAnimation(component.animationState,
        component.animationComponentProperties, float(dt), nullptr, nullptr);
  });
}

//
// Draw
//

void Drawing2Behavior::handleDrawComponent(
    ActorId actorId, const Drawing2Component &component) const {
  if (!component.drawData) {
    return;
  }

  if (auto body = getBehaviors().byType<BodyBehavior>().maybeGetPhysicsBody(actorId)) {
    lv.graphics.push();
    auto [x, y] = body->GetPosition();
    lv.graphics.translate(x, y);
    lv.graphics.rotate(body->GetAngle());

    auto scale = getBehaviors().byType<BodyBehavior>().getScale(actorId);
    lv.graphics.scale(scale.x, scale.y);

    lv.graphics.setColor(love::Colorf(1, 1, 1, 1));
    component.drawData->render(component.animationComponentProperties);

    lv.graphics.pop();
  }
}
