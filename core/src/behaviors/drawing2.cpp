#include "drawing2.h"

#include "behaviors/all.h"


//
// Triggers
//

struct AnimationEndTrigger : BaseTrigger {
  inline static const RuleRegistration<AnimationEndTrigger, Drawing2Behavior> registration {
    "animation end"
  };

  struct Params {
  } params;
};

struct AnimationLoopTrigger : BaseTrigger {
  inline static const RuleRegistration<AnimationLoopTrigger, Drawing2Behavior> registration {
    "animation loop"
  };

  struct Params {
  } params;
};

struct AnimationReachesFrameTrigger : BaseTrigger {
  inline static const RuleRegistration<AnimationReachesFrameTrigger, Drawing2Behavior>
      registration { "animation reaches frame" };

  struct Params {
    PROP(std::string, comparison) = "equal";
    PROP(int, frame) = 1;
  } params;
};

struct AnimationFrameChangesTrigger : BaseTrigger {
  inline static const RuleRegistration<AnimationFrameChangesTrigger, Drawing2Behavior>
      registration { "animation frame changes" };

  struct Params {
  } params;
};


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
      auto drawData = component->drawData.get();
      auto &animProps = component->animationComponentProperties;
      auto oneIndexedFrame = drawData->modFrameIndex(animProps.currentFrame) + 1;
      return ExpressionValue(oneIndexedFrame).compare(comparison, frame);
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


//
// Perform
//

void Drawing2Behavior::handlePerform(double dt) {
  if (!hasAnyEnabledComponent()) {
    return; // Skip gesture logic if no components
  }

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
    return animProps.currentFrame;
  } else if (propId == decltype(DrawingAnimationProps::playMode)::id) {
    // TODO(nikki): Handle string values, then implement this
    return {};
  } else if (propId == decltype(DrawingAnimationProps::framesPerSecond)::id) {
    return animProps.framesPerSecond;
  } else if (propId == decltype(DrawingAnimationProps::loopStartFrame)::id) {
    return animProps.loopStartFrame;
  } else if (propId == decltype(DrawingAnimationProps::loopEndFrame)::id) {
    return animProps.loopEndFrame;
  } else {
    return BaseBehavior::handleGetProperty(actorId, component, propId);
  }
}

void Drawing2Behavior::handleSetProperty(
    ActorId actorId, Drawing2Component &component, PropId propId, const ExpressionValue &value) {
  fireChangeFrameTriggers(actorId, component);
  auto &animProps = component.animationComponentProperties;
  if (propId == decltype(DrawingAnimationProps::currentFrame)::id) {
    animProps.currentFrame = value.as<int>();
  } else if (propId == decltype(DrawingAnimationProps::playMode)::id) {
    // TODO(nikki): Handle string values, then implement this
  } else if (propId == decltype(DrawingAnimationProps::framesPerSecond)::id) {
    animProps.framesPerSecond = value.as<float>();
  } else if (propId == decltype(DrawingAnimationProps::loopStartFrame)::id) {
    animProps.loopStartFrame = value.as<int>();
  } else if (propId == decltype(DrawingAnimationProps::loopEndFrame)::id) {
    animProps.loopEndFrame = value.as<int>();
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
  auto oneIndexedFrame = ExpressionValue(drawData->modFrameIndex(animProps.currentFrame) + 1);
  rulesBehavior.fireIf<AnimationReachesFrameTrigger>(
      actorId, {}, [&](const AnimationReachesFrameTrigger &trigger) {
        return oneIndexedFrame.compare(trigger.params.comparison(), trigger.params.frame());
      });
}
