#pragma once

#include "precomp.h"

#include "behaviors/base.h"
#include "props.h"


struct AnalogStickComponent : BaseComponent {
  struct Props {
    PROP(
         float, speed,
         .label("Speed")
         .min(-50)
         .max(50)
         ) = 6;
    PROP(
         float, turnFriction,
         .label("Turn friction")
         .min(0)
         .max(10)
         ) = 3;
    PROP(
         std::string, axes,
         .allowedValues("x and y", "x", "y")
         ) = "x and y";
  } props;
};

class AnalogStickBehavior : public BaseBehavior<AnalogStickBehavior, AnalogStickComponent> {
public:
  static constexpr auto name = "AnalogStick";
  static constexpr auto behaviorId = 21;
  static constexpr auto displayName = "Analog Stick";
  static constexpr auto allowsDisableWithoutRemoval = true;

  using BaseBehavior::BaseBehavior;


  void handlePerform(double dt);

  void handleDrawOverlay() const;


private:
  Lv &lv { Lv::getInstance() };

  TouchId lastTouchId = nullTouch; // Track our touch even if it's used for a different purpose
                                   // after the gesture starts
  love::Vector2 center;
};
