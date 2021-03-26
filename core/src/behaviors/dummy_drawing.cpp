#include "dummy_drawing.h"

#include "behaviors/all.h"


//
// Draw
//

void DummyDrawingBehavior::handleDrawComponent(
    ActorId actorId, const DummyDrawingComponent &component) const {
  if (auto maybeBodyComponent = getBehaviors().byType<BodyBehavior>().maybeGetComponent(actorId)) {
    auto &bodyComponent = *maybeBodyComponent;
    lv.graphics.push();
    auto [x, y] = bodyComponent.body->GetPosition();
    lv.graphics.translate(x, y);
    lv.graphics.rotate(bodyComponent.body->GetAngle());
    lv.graphics.setColor(love::Colorf(0.4, 0.4, 0.2, 1));
    lv.graphics.rectangle(love::Graphics::DRAW_FILL, -0.25, -0.25, 0.5, 0.5);
    lv.graphics.pop();
  }
}
