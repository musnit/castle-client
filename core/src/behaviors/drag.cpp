#include "drag.h"

#include "behaviors/all.h"


static const TouchToken dragToken;


//
// Enable, disable
//

void DragBehavior::handleDisableComponent(
    ActorId actorId, DragComponent &component, bool removeActor) {
  if (!removeActor) {
    // Clear all handles
    if (auto body = getBehaviors().byType<BodyBehavior>().maybeGetPhysicsBody(actorId)) {
      // Body destruction destroys attached joints, so make sure to have checked that
      for (auto &handle : component.handles) {
        getScene().getPhysicsWorld().DestroyJoint(handle.joint);
      }
    }
    component.handles.clear();
  }
}


//
// Perform
//

void DragBehavior::handlePerform(double dt) {
  if (!hasAnyEnabledComponent()) {
    return; // Nothing to do if no components
  }

  auto &scene = getScene();
  auto &bodyBehavior = getBehaviors().byType<BodyBehavior>();

  // Create handles on touch presses
  getGesture().forEachTouch([&](TouchId touchId, const Touch &touch) {
    if (touch.isUsed() && !touch.isUsed(BodyBehavior::triggerTouchToken)) {
      return; // Skip physics logic if touch already used
    }
    if (touch.pressed) {
      // Find topmost actor at point
      DragComponent *hitComponent = nullptr;
      const b2Body *hitBody = nullptr;
      auto maxDrawOrder = Scene::minDrawOrder;
      for (auto actorId : bodyBehavior.getActorsAtTouch(touchId)) {
        if (auto component = maybeGetComponent(actorId); component && !component->disabled) {
          if (auto drawOrder = scene.maybeGetDrawOrder(actorId);
              drawOrder && maxDrawOrder < *drawOrder) {
            if (auto body = bodyBehavior.maybeGetPhysicsBody(actorId)) {
              hitComponent = component;
              hitBody = body;
              maxDrawOrder = *drawOrder;
            }
          }
        }
      }
      if (hitComponent && (touch.isUsed(BodyBehavior::triggerTouchToken) || touch.use(dragToken))) {
        b2MouseJointDef jointDef;
        jointDef.bodyA = scene.getPhysicsBackgroundBody();
        jointDef.bodyB = const_cast<b2Body *>(hitBody);
        jointDef.target = { touch.pos.x, touch.pos.y };
        jointDef.maxForce = 1000 * hitBody->GetMass(); // This is what Love does in its `MouseJoint`
        b2LinearStiffness(jointDef.stiffness, jointDef.damping, 5.0, 0.7, jointDef.bodyA,
            jointDef.bodyB); // This is needed in the new Box2D (see its 'test.cpp')
        hitComponent->handles.push_back({
            touchId,
            (b2MouseJoint *)scene.getPhysicsWorld().CreateJoint(&jointDef),
            hitBody->GetLocalPoint(jointDef.target),
        });
      }
    }
  });

  // Update or remove existing handles
  forEachEnabledComponent([&](ActorId actorId, DragComponent &component) {
    auto &handles = component.handles;
    if (handles.empty()) {
      return; // Early exit if no handles
    }

    // Iterate and set `.joint` to `nullptr` to mark for removal, then use `std::remove_if`
    for (auto &handle : handles) {
      if (handle.joint) { // Just in case...
        if (auto body = bodyBehavior.maybeGetPhysicsBody(actorId)) {
          if (auto touch = getGesture().maybeGetTouch(handle.touchId); touch && !touch->released) {
            // Touch not yet released -- update joint
            handle.joint->SetTarget({ touch->pos.x, touch->pos.y });
          } else {
            // Touch released or no longer exists -- destroy joint and remove handle
            scene.getPhysicsWorld().DestroyJoint(handle.joint);
            handle.joint = nullptr;
          }
        } else {
          // No body -- joint isn't valid anymore so just remove handle
          handle.joint = nullptr;
        }
      }
    }
    handles.erase(std::remove_if(handles.begin(), handles.end(),
                      [&](DragComponent::Handle &handle) {
                        return handle.joint == nullptr;
                      }),
        handles.end());
  });
}


//
// Draw
//

void DragBehavior::handleDrawOverlay() const {
  if (!hasAnyEnabledComponent()) {
    return; // Nothing to draw if no components
  }

  lv.graphics.push();

  auto pixelScale = getScene().getPixelScale();
  lv.graphics.setLineWidth(1.25f * pixelScale);

  auto circleRadius = 18 * pixelScale;

  auto cameraPos = getScene().getCameraPosition();

  forEachEnabledComponent([&](ActorId actorId, const DragComponent &component) {
    auto &handles = component.handles;
    if (handles.empty()) {
      return; // Skip body lookup if no handles
    }
    if (auto body = getBehaviors().byType<BodyBehavior>().maybeGetPhysicsBody(actorId)) {
      for (auto &handle : handles) {
        if (auto touch = getGesture().maybeGetTouch(handle.touchId); touch && !touch->released) {
          // Draw circles at handle and touch, with a line connecting them

          auto handlePos = body->GetWorldPoint(handle.localPos);
          lv.graphics.setColor({ 1, 1, 1, 0.8 });
          lv.graphics.circle(love::Graphics::DRAW_LINE, handlePos.x, handlePos.y, circleRadius);
          lv.graphics.setColor({ 1, 1, 1, 0.3 });
          lv.graphics.circle(love::Graphics::DRAW_FILL, handlePos.x, handlePos.y, circleRadius);

          auto touchPos = touch->cameraPos + cameraPos; // Use most up-to-date position
          lv.graphics.setColor({ 1, 1, 1, 0.8 });
          lv.graphics.circle(love::Graphics::DRAW_LINE, touchPos.x, touchPos.y, circleRadius);
          lv.graphics.setColor({ 1, 1, 1, 0.3 });
          lv.graphics.circle(love::Graphics::DRAW_FILL, touchPos.x, touchPos.y, circleRadius);

          lv.graphics.setColor({ 1, 1, 1, 0.8 });
          std::array line { love::Vector2(handlePos.x, handlePos.y), touchPos };
          lv.graphics.polyline(line.data(), line.size());
        }
      }
    }
  });

  lv.graphics.pop();
}
