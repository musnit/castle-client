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
  static constexpr auto displayName = "Analog Stick";

  using BaseBehavior::BaseBehavior;


  void handlePerform(double dt);

  void handleDrawOverlay() const;


private:
  Lv &lv { Lv::getInstance() };

  TouchId lastTouchId = nullTouch; // Track our touch even if it's used for a different purpose
                                   // after the gesture starts
  love::Vector2 center;
};
