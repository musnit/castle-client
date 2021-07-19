#include "drawing2.h"

#include "behaviors/all.h"


//
// Triggers
//

struct AnimationEndTrigger : BaseTrigger {
  inline static const RuleRegistration<AnimationEndTrigger, Drawing2Behavior> registration {
    "animation end"
  };
  static constexpr auto description = "When the animation ends";

  struct Params {
  } params;
};

struct AnimationLoopTrigger : BaseTrigger {
  inline static const RuleRegistration<AnimationLoopTrigger, Drawing2Behavior> registration {
    "animation loop"
  };
  static constexpr auto description = "When the animation loops";

  struct Params {
  } params;
};

struct AnimationFrameChangesTrigger : BaseTrigger {
  inline static const RuleRegistration<AnimationFrameChangesTrigger, Drawing2Behavior>
      registration { "animation frame changes" };
  static constexpr auto description = "When the animation frame changes";

  struct Params {
  } params;
};

struct AnimationReachesFrameTrigger : BaseTrigger {
  inline static const RuleRegistration<AnimationReachesFrameTrigger, Drawing2Behavior>
      registration { "animation reaches frame" };
  static constexpr auto description = "When the animation reaches a specific frame";

  struct Params {
    PROP(ExpressionComparison, comparison);
    PROP(int, frame) = 1;
  } params;
};


//
// Responses
//

struct AnimationFrameMeetsConditionResponse : BaseResponse {
  inline static const RuleRegistration<AnimationFrameMeetsConditionResponse, Drawing2Behavior>
      registration { "animation frame meets condition" };
  static constexpr auto description = "If the animation frame meets a condition";

  struct Params {
    PROP(ExpressionComparison, comparison);
    PROP(ExpressionRef, frame) = 1;
  } params;

  bool eval(RuleContext &ctx) override {
    auto &drawing2Behavior = ctx.getScene().getBehaviors().byType<Drawing2Behavior>();
    auto &comparison = params.comparison();
    if (auto component = drawing2Behavior.maybeGetComponent(ctx.actorId)) {
      auto drawData = component->drawData.get();
      auto frame = ExpressionValue(drawData->modFrameIndex(params.frame().eval(ctx).as<int>() - 1));
      auto &animProps = component->animationComponentProperties;
      auto currentFrame = drawData->modFrameIndex(animProps.currentFrame);
      return comparison.compare(ExpressionValue(currentFrame), frame);
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

  component.animationComponentProperties.read(reader);

  if (auto found = drawDataCache.find(component.hash); found == drawDataCache.end()) {
    reader.obj("drawData", [&]() {
      component.drawData = std::make_shared<love::DrawData>(reader);
      drawDataCache.insert_or_assign(component.hash, component.drawData);
    });
  } else {
    component.drawData = found->second;
  }
}

void Drawing2Behavior::handleWriteComponent(
    ActorId actorId, const Drawing2Component &component, Writer &writer) const {
  writer.str("hash", component.hash);
  component.animationComponentProperties.write(writer);
  writer.obj("drawData", *component.drawData);
}

//
// Perform
//

void Drawing2Behavior::handlePerform(double dt) {
  auto &rulesBehavior = getBehaviors().byType<RulesBehavior>();
  forEachEnabledComponent([&](ActorId actorId, Drawing2Component &component) {
    auto drawData = component.drawData.get();
    auto &animProps = component.animationComponentProperties;
    auto result = drawData->runAnimation(component.animationState, animProps, float(dt));
    if (result.loop) {
      rulesBehavior.fire<AnimationLoopTrigger>(actorId, {});
    }
    if (result.end) {
      rulesBehavior.fire<AnimationEndTrigger>(actorId, {});
    }
    if (result.changed) {
      fireChangeFrameTriggers(actorId, component);
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
      component.drawData->render(component.animationComponentProperties);

      lv.graphics.pop();
    }
  }
}


//
// Getters, setters
//

ExpressionValue Drawing2Behavior::handleGetProperty(
    ActorId actorId, const Drawing2Component &component, PropId propId) const {
  auto &animProps = component.animationComponentProperties;
  if (propId == decltype(DrawingAnimationProps::currentFrame)::id) {
    return animProps.currentFrame.value;
  } else if (propId == decltype(DrawingAnimationProps::playMode)::id) {
    if (!animProps.playing) {
      return "still";
    } else if (animProps.loop) {
      return "loop";
    } else {
      return "play once";
    }
    return {};
  } else if (propId == decltype(DrawingAnimationProps::framesPerSecond)::id) {
    return animProps.framesPerSecond;
  } else if (propId == decltype(DrawingAnimationProps::loopStartFrame)::id) {
    return animProps.loopStartFrame.value;
  } else if (propId == decltype(DrawingAnimationProps::loopEndFrame)::id) {
    return animProps.loopEndFrame.value;
  } else {
    return BaseBehavior::handleGetProperty(actorId, component, propId);
  }
}

void Drawing2Behavior::handleSetProperty(
    ActorId actorId, Drawing2Component &component, PropId propId, const ExpressionValue &value) {
  auto &animProps = component.animationComponentProperties;
  if (propId == decltype(DrawingAnimationProps::currentFrame)::id) {
    animProps.currentFrame.value = int(std::round(value.as<double>()));
    fireChangeFrameTriggers(actorId, component);
  } else if (propId == decltype(DrawingAnimationProps::playMode)::id) {
    if (value.is<const char *>()) {
      auto playMode = value.as<const char *>();
      if (playMode[0] == 's') { // "still"
        animProps.playing = false;
        animProps.loop = false;
      } else if (playMode[0] == 'p') { // "play once"
        animProps.playing = true;
        animProps.loop = false;
      } else { // "loop"
        animProps.playing = true;
        animProps.loop = true;
      }
    }
  } else if (propId == decltype(DrawingAnimationProps::framesPerSecond)::id) {
    animProps.framesPerSecond = value.as<float>();
  } else if (propId == decltype(DrawingAnimationProps::loopStartFrame)::id) {
    animProps.loopStartFrame.value = int(std::round(value.as<double>()));
  } else if (propId == decltype(DrawingAnimationProps::loopEndFrame)::id) {
    animProps.loopEndFrame.value = int(std::round(value.as<double>()));
  } else {
    BaseBehavior::handleSetProperty(actorId, component, propId, value);
  }
}


//
// Frame change triggering
//

void Drawing2Behavior::fireChangeFrameTriggers(
    ActorId actorId, const Drawing2Component &component) {
  auto &rulesBehavior = getBehaviors().byType<RulesBehavior>();
  auto drawData = component.drawData.get();
  auto &animProps = component.animationComponentProperties;
  rulesBehavior.fire<AnimationFrameChangesTrigger>(actorId, {});
  auto currentFrame = ExpressionValue(drawData->modFrameIndex(animProps.currentFrame));
  rulesBehavior.fireIf<AnimationReachesFrameTrigger>(
      actorId, {}, [&](const AnimationReachesFrameTrigger &trigger) {
        auto triggerFrame = ExpressionValue(drawData->modFrameIndex(trigger.params.frame() - 1));
        return trigger.params.comparison().compare(currentFrame, triggerFrame);
      });
}
