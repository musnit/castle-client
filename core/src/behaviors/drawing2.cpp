#include "drawing2.h"

#include "behaviors/all.h"

void getAnimationComponentProperties(
    const Drawing2Component &component, love::AnimationComponentProperties &properties) {
  auto playMode = component.props.playMode();
  if (playMode[0] == 's') { // "still"
    properties.playing = false;
    properties.loop = false;
  } else if (playMode[0] == 'p') { // "play once"
    properties.playing = true;
    properties.loop = false;
  } else { // "loop"
    properties.playing = true;
    properties.loop = true;
  }

  properties.framesPerSecond = component.props.framesPerSecond();
  properties.loopStartFrame.value = int(std::round(component.props.loopStartFrame()));
  properties.loopEndFrame.value = int(std::round(component.props.loopEndFrame()));
  properties.currentFrame.value = int(std::round(component.props.currentFrame()));
}


void applyAnimationComponentProperties(
    Drawing2Component &component, love::AnimationComponentProperties &properties) {
  if (!properties.playing && !properties.loop) {
    component.props.playMode() = "still";
  } else if (properties.playing && !properties.loop) {
    component.props.playMode() = "play once";
  } else {
    component.props.playMode() = "loop";
  }

  component.props.framesPerSecond() = properties.framesPerSecond;
  component.props.loopStartFrame() = properties.loopStartFrame.value;
  component.props.loopEndFrame() = properties.loopEndFrame.value;
  component.props.currentFrame() = properties.currentFrame.value;
}

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
      love::AnimationComponentProperties animProps;
      getAnimationComponentProperties(*component, animProps);
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

  if (auto found = drawDataCache.find(component.hash); found == drawDataCache.end()) {
    reader.obj("drawData", [&]() {
      component.drawData = std::make_shared<love::DrawData>(reader);
      drawDataCache.insert_or_assign(component.hash, component.drawData);
    });
  } else {
    component.drawData = found->second;
  }

  reader.obj("physicsBodyData", [&]() {
    component.physicsBodyData = std::make_shared<PhysicsBodyData>(reader);
  });
}

void Drawing2Behavior::handleWriteComponent(
    ActorId actorId, const Drawing2Component &component, Writer &writer) const {
  writer.str("hash", component.hash);

  love::AnimationComponentProperties animProps;
  getAnimationComponentProperties(component, animProps);

  animProps.write(writer);
  writer.obj("drawData", *component.drawData);
}

//
// Perform
//

void Drawing2Behavior::handlePerform(double dt) {
  auto &rulesBehavior = getBehaviors().byType<RulesBehavior>();
  forEachEnabledComponent([&](ActorId actorId, Drawing2Component &component) {
    auto drawData = component.drawData.get();

    love::AnimationComponentProperties animProps;
    getAnimationComponentProperties(component, animProps);

    auto result = drawData->runAnimation(component.animationState, animProps, float(dt));

    applyAnimationComponentProperties(component, animProps);

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

      love::AnimationComponentProperties animProps;
      getAnimationComponentProperties(component, animProps);
      component.drawData->render(animProps);

      lv.graphics.pop();
    }
  }
}


//
// Getters, setters
//

ExpressionValue Drawing2Behavior::handleGetProperty(
    ActorId actorId, const Drawing2Component &component, PropId propId) const {
  love::AnimationComponentProperties animProps;
  getAnimationComponentProperties(component, animProps);

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
  love::AnimationComponentProperties animProps;
  getAnimationComponentProperties(component, animProps);

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
  }

  applyAnimationComponentProperties(component, animProps);

  BaseBehavior::handleSetProperty(actorId, component, propId, value);
}


//
// Frame change triggering
//

void Drawing2Behavior::fireChangeFrameTriggers(
    ActorId actorId, const Drawing2Component &component) {
  auto &rulesBehavior = getBehaviors().byType<RulesBehavior>();
  auto drawData = component.drawData.get();

  love::AnimationComponentProperties animProps;
  getAnimationComponentProperties(component, animProps);

  rulesBehavior.fire<AnimationFrameChangesTrigger>(actorId, {});
  auto currentFrame = ExpressionValue(drawData->modFrameIndex(animProps.currentFrame));
  rulesBehavior.fireIf<AnimationReachesFrameTrigger>(
      actorId, {}, [&](const AnimationReachesFrameTrigger &trigger) {
        auto triggerFrame = ExpressionValue(drawData->modFrameIndex(trigger.params.frame() - 1));
        return trigger.params.comparison().compare(currentFrame, triggerFrame);
      });
}
