#pragma once

#include "precomp.h"

#include "behaviors/base.h"
#include "props.h"


struct SlingComponent : BaseComponent {
  struct Props {
    PROP(
         float, speed,
         .label("Speed")
         .min(0)
         .max(10)
         ) = 3.5;
  } props;
};

class SlingBehavior : public BaseBehavior<SlingBehavior, SlingComponent> {
public:
  static constexpr auto name = "Sling";
  static constexpr auto behaviorId = 14;
  static constexpr auto displayName = "Slingshot";

  using BaseBehavior::BaseBehavior;


  void handlePerform(double dt);

  void handleDrawOverlay() const;


private:
  Lv &lv { Lv::getInstance() };
};
