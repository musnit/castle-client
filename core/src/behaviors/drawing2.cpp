#include "drawing2.h"

#include "behaviors/all.h"


//
// Responses
//

struct AnimationFrameMeetsConditionResponse : BaseResponse {
  inline static const RuleRegistration<AnimationFrameMeetsConditionResponse, Drawing2Behavior>
      registration { "animation frame meets condition" };

  struct Params {
    PROP(std::string, comparison) = "equal";
    PROP(ExpressionRef, frame) = 1;
  } params;

  bool eval(RuleContext &ctx) override {
    auto &drawing2Behavior = ctx.getScene().getBehaviors().byType<Drawing2Behavior>();
    auto &comparison = params.comparison();
    auto frame = params.frame().eval(ctx);
    if (auto component = drawing2Behavior.maybeGetComponent(ctx.actorId)) {
      return ExpressionValue(component->props.currentFrame()).compare(comparison, frame);
    }
    return false;
  }
};


//
// Read, write
//

void Drawing2Behavior::handleReadComponent(
    ActorId actorId, Drawing2Component &component, Reader &reader) {
  component.hash = reader.str("hash", "");
  if (auto found = drawDataCache.find(component.hash); found == drawDataCache.end()) {
    reader.obj("drawData", [&]() {
      component.drawData = std::make_shared<love::DrawData>(reader);
      drawDataCache.insert_or_assign(component.hash, component.drawData);
    });
  } else {
    component.drawData = found->second;
  }
  component.props.currentFrame() = reader.num("initialFrame", 1);
}

//
// Perform
//

void Drawing2Behavior::handlePerform(double dt) {
  // Animation
  forEachEnabledComponent([&](ActorId actorId, Drawing2Component &component) {
    if (!component.props.playing()) {
      return;
    }

    auto drawData = component.drawData.get();
    auto numFrames = drawData->getNumFrames();

    component.frameTime += dt;
    auto secondsPerFrame = 1 / component.props.framesPerSecond();
    if (component.frameTime > abs(secondsPerFrame)) {
      component.frameTime = component.frameTime - abs(secondsPerFrame);
      auto firstFrame = component.props.loopStartFrame();
      if (firstFrame < 1 || firstFrame > numFrames) {
        firstFrame = 1;
      }
      auto lastFrame = component.props.loopEndFrame();
      if (lastFrame < 1 || lastFrame > numFrames) {
        lastFrame = numFrames;
      }
      auto currentFrame = drawData->modFrameIndex(component.props.currentFrame());
      auto changedFrames = false;
      if (secondsPerFrame > 0) {
        if (currentFrame == lastFrame) {
          if (component.props.loop()) {
            component.props.currentFrame() = firstFrame;
            changedFrames = true;
            //if (fireTrigger) {
            //  fireTrigger("animation loop");
            //}
          } else {
            component.props.playing = false;
            component.frameTime = 0;
            //if (fireTrigger) {
            //  fireTrigger("animation end");
            //}
          }
        } else {
          component.props.currentFrame() = currentFrame + 1;
          changedFrames = true;
        }
      } else {
        if (currentFrame == firstFrame) {
          if (component.props.loop()) {
            component.props.currentFrame() = lastFrame;
            changedFrames = true;
            //if (fireTrigger) {
            //  fireTrigger("animation loop");
            //}
          } else {
            component.props.playing = false;
            component.frameTime = 0;
            //if (fireTrigger) {
            //  fireTrigger("animation end");
            //}
          }
        } else {
          component.props.currentFrame() = currentFrame - 1;
          changedFrames = true;
        }
      }
      //if (changedFrames && fireChangedFrame) {
      //  fireChangedFrame();
      //}
    }
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
    if (auto info = getBehaviors().byType<BodyBehavior>().getRenderInfo(actorId); info.visible) {
      lv.graphics.push();

      auto [x, y] = body->GetPosition();
      lv.graphics.translate(x, y);
      lv.graphics.rotate(body->GetAngle());
      lv.graphics.scale(info.widthScale, info.heightScale);

      lv.graphics.setColor(love::Colorf(1, 1, 1, 1));
      component.drawData->render(component.props.currentFrame());

      lv.graphics.pop();
    }
  }
}
