#pragma once

#include "precomp.h"

#include "behaviors/base.h"
#include "props.h"


struct AnalogStickComponent : BaseComponent {
  struct Props {
    PROP(float, speed) = 6;
    PROP(float, turnFriction) = 3;
    PROP(std::string, axes) = "x and y";
  } props;
};

class AnalogStickBehavior : public BaseBehavior<AnalogStickBehavior, AnalogStickComponent> {
public:
  static constexpr auto name = "AnalogStick";
  static constexpr auto behaviorId = 21;

  using BaseBehavior::BaseBehavior;


  void handlePerform(double dt);

  void handleDrawOverlay() const;


private:
  Lv &lv { Lv::getInstance() };

  love::Vector2 center;
};
