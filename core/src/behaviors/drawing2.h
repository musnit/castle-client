#pragma once

#include "precomp.h"

#include "behaviors/base.h"
#include "props.h"


struct Drawing2Component : BaseComponent {
  struct Props {
  } props;

  std::string hash;
  std::shared_ptr<love::DrawData> drawData;
  love::AnimationComponentProperties animationComponentProperties;
  love::AnimationState animationState;
};

struct DrawingAnimationProps {
  // Instances of this struct are never actually created -- it's just used for the prop ids

  DrawingAnimationProps() = delete;

  PROP(int, currentFrame);
  PROP(std::string, playMode);
  PROP(float, framesPerSecond);
  PROP(int, loopStartFrame);
  PROP(int, loopEndFrame);
};

class Drawing2Behavior : public BaseBehavior<Drawing2Behavior, Drawing2Component> {

public:
  static constexpr auto name = "Drawing2";
  static constexpr auto behaviorId = 20;

  using BaseBehavior::BaseBehavior;

  void handleReadComponent(ActorId actorId, Drawing2Component &component, Reader &reader);
  void handlePerform(double dt);
  void handleDrawComponent(ActorId actorId, const Drawing2Component &component) const;

  ExpressionValue handleGetProperty(
      ActorId actorId, const Drawing2Component &component, PropId propId) const;
  void handleSetProperty(
      ActorId actorId, Drawing2Component &component, PropId propId, const ExpressionValue &value);

private:
  friend struct AnimationFrameMeetsConditionResponse;

  Lv &lv { Lv::getInstance() };

  std::unordered_map<std::string, std::shared_ptr<love::DrawData>> drawDataCache;


  void fireChangeFrameTriggers(ActorId actorId, const Drawing2Component &component);
};
