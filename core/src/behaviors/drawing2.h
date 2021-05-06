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

class Drawing2Behavior : public BaseBehavior<Drawing2Behavior, Drawing2Component> {

public:
  static constexpr auto name = "Drawing2";
  static constexpr auto behaviorId = 20;

  using BaseBehavior::BaseBehavior;

  void handleReadComponent(ActorId actorId, Drawing2Component &component, Reader &reader);
  void handlePerform(double dt);
  void handleDrawComponent(ActorId actorId, const Drawing2Component &component) const;

private:
  Lv &lv { Lv::getInstance() };

  std::unordered_map<std::string, std::shared_ptr<love::DrawData>> drawDataCache;
};
