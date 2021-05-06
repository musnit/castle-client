#pragma once

#include "precomp.h"

#include "behaviors/base.h"
#include "props.h"


struct Drawing2Component : BaseComponent {
  struct Props {
    PROP(bool, playing) = false;
    PROP(double, framesPerSecond) = false;
    PROP(int, currentFrame) = 1;
    PROP(bool, loop) = false;
    PROP(int, loopStartFrame) = -1;
    PROP(int, loopEndFrame) = -1;
  } props;

  std::string hash;
  std::shared_ptr<love::DrawData> drawData;

  double frameTime = 0;
};

class Drawing2Behavior : public BaseBehavior<Drawing2Behavior, Drawing2Component> {

public:
  static constexpr auto name = "Drawing2";
  static constexpr auto behaviorId = 20;

  using BaseBehavior::BaseBehavior;

  void handleReadComponent(ActorId actorId, Drawing2Component &component, Reader &reader);
  void handlePerform(double dt);
  void handleDrawComponent(ActorId actorId, const Drawing2Component &component) const;

private:
  friend struct AnimationFrameMeetsConditionResponse;

  Lv &lv { Lv::getInstance() };

  std::unordered_map<std::string, std::shared_ptr<love::DrawData>> drawDataCache;
};
