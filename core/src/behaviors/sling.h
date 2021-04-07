#pragma once

#include "precomp.h"

#include "behaviors/base.h"
#include "props.h"


struct SlingComponent : BaseComponent {
  struct Props {
    PROP(float, speed) = 0;
  } props;
};

class SlingBehavior : public BaseBehavior<SlingBehavior, SlingComponent> {
public:
  static constexpr char name[] = "Sling";

  using BaseBehavior::BaseBehavior;


  void handlePerform(double dt);

  void handleDrawOverlay() const;


private:
  Lv &lv { Lv::getInstance() };
};
