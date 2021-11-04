#include "drawing2.h"

#include "behaviors/all.h"

void Drawing2Behavior::getAnimationComponentProperties(
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
    PROP(ExpressionRef, frame) = 1;
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
      Drawing2Behavior::getAnimationComponentProperties(*component, animProps);
      auto currentFrame = drawData->modFrameIndex(animProps.currentFrame);
      return comparison.compare(ExpressionValue(currentFrame), frame);
    }
    return false;
  }
};


//
// Read, write
//

std::string Drawing2Behavior::hash(
    const std::string &drawData, const std::string &physicsBodyData) {
  auto hash = std::hash<std::string> {}(drawData + physicsBodyData);

  char str[256];
  snprintf(str, sizeof str, "%zu", hash);

  return std::string(str);
}

void Drawing2Behavior::handleReadComponent(
    ActorId actorId, Drawing2Component &component, Reader &reader) {
  love::AnimationComponentProperties animProps;
  animProps.read(reader);
  applyAnimationComponentProperties(component, animProps);

  component.hash = reader.str("hash", "");
  if (!component.hash.empty()) {
    if (auto found = drawDataCache.find(component.hash); found != drawDataCache.end()) {
      component.drawData = found->second;
    } else {
      reader.obj("drawData", [&]() {
        component.drawData = std::make_shared<love::DrawData>(reader);
        drawDataCache.insert_or_assign(component.hash, component.drawData);
      });
    }
  } else {
    reader.obj("drawData", [&]() {
      component.drawData = std::make_shared<love::DrawData>(reader);
    });
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

  writer.obj("drawData", [&]() {
    component.drawData->write(writer);
  });

  writer.obj("physicsBodyData", [&]() {
    component.physicsBodyData->write(writer);
  });
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

bool Drawing2Behavior::handleDrawComponent(ActorId actorId, const Drawing2Component &component,
    std::optional<SceneDrawingOptions> options) const {
  if (!component.drawData) {
    return false;
  }

  auto drawn = false;
  if (auto body = getBehaviors().byType<BodyBehavior>().maybeGetPhysicsBody(actorId)) {
    if (auto info = getBehaviors().byType<BodyBehavior>().getRenderInfo(actorId);
        info.visible || (options && options->drawInvisibleActors)) {
      auto [x, y] = body->GetPosition();

      // Do an upper bound test if we're camera-visible and reject if not. We don't need an exact
      // transformation: we use the maximum scale in either direction and the `sqrt2` factor
      // accounts for rotation.

      constexpr auto sqrt2 = 1.42; // Upper bound
      auto maxScale = std::max(info.widthScale, info.heightScale);
      auto maxHalfSize = sqrt2 * (DRAW_MAX_SIZE + 0.5 * DRAW_LINE_WIDTH) * maxScale;

      auto &scene = getScene();
      auto cameraPos = scene.getCameraPosition();
      auto halfCameraSize = 0.5 * scene.getCameraSize();
      auto oldHalfCameraHeight = halfCameraSize.y; // Adjust for larger aspect ratio when editing
      halfCameraSize.y
          = halfCameraSize.x * float(lv.graphics.getHeight()) / float(lv.graphics.getWidth());
      cameraPos.y += halfCameraSize.y - oldHalfCameraHeight;

      if (std::abs(x - cameraPos.x) <= halfCameraSize.x + maxHalfSize
          && std::abs(y - cameraPos.y) <= halfCameraSize.y + maxHalfSize) {
        drawn = true;

        lv.graphics.push();

        lv.graphics.translate(x, y);
        lv.graphics.rotate(body->GetAngle());
        lv.graphics.scale(info.widthScale, info.heightScale);

        lv.graphics.setColor(love::Colorf(1, 1, 1, 1));

        love::AnimationComponentProperties animProps;
        getAnimationComponentProperties(component, animProps);
        auto frameIndex = animProps.currentFrame.toZeroIndex();

        // maybe override the drawn frame from options (for editor's view in context)
        if (options && options->editorDrawingActorId != nullActor) {
          auto &scene = getScene();
          if (strcmp(scene.maybeGetParentEntryId(actorId),
                  scene.maybeGetParentEntryId(options->editorDrawingActorId))
              == 0) {
            if (options->editorDrawingAnimationFrame >= 0) {
              frameIndex = options->editorDrawingAnimationFrame;
            }
          }
        }

        component.drawData->renderFrameIndex(frameIndex);

        lv.graphics.pop();
      }
    }
  }

  return drawn;
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

  if (propId == decltype(Drawing2Component::Props::initialFrame)::id) {
    component.props.initialFrame() = float(std::round(value.as<double>()));
    component.props.currentFrame() = component.props.initialFrame();
    animProps.currentFrame.value = int(component.props.initialFrame());
  } else if (propId == decltype(DrawingAnimationProps::currentFrame)::id) {
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
        auto frame = rulesBehavior.evalIndependent(trigger.params.frame()).as<int>();
        auto modFrame = ExpressionValue(drawData->modFrameIndex(frame - 1));
        return trigger.params.comparison().compare(currentFrame, modFrame);
      });
}


//
// Editor-only state
//

void Drawing2Behavior::writeBase64PngFrames(
    const Drawing2Component &component, EditorSelectedDrawingFramesEvent *ev) {
  if (!editorDataCache) {
    editorDataCache = std::make_unique<DrawingEditorDataCache>();
  }
  if (editorDataCache->items.find(component.hash) == editorDataCache->items.end()) {
    DrawingEditorDataCache::Item item;
    for (int frameIdx = 0; frameIdx < component.drawData->getNumFrames(); frameIdx++) {
      auto maybeBase64Png = component.drawData->renderPreviewPng(frameIdx, -1);
      if (maybeBase64Png) {
        item.base64PngFrames.push_back(maybeBase64Png.value());
      } else {
        item.base64PngFrames.emplace_back();
      }
    }
    editorDataCache->items.emplace(component.hash, item);
  }
  ev->base64PngFrames = &(editorDataCache->items[component.hash].base64PngFrames);
}

void Drawing2Behavior::clearEditorDataCache() {
  if (editorDataCache) {
    editorDataCache->items.clear();
  }
}
