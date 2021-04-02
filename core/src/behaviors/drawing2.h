#pragma once

#include "precomp.h"

#include "behaviors/base.h"
#include "props.h"


struct Drawing2Component : BaseComponent {
  struct Props {
    PROP(std::string, drawData) = "";
  } props;
};

class Drawing2Behavior : public BaseBehavior<Drawing2Behavior, Drawing2Component> {

public:
  static constexpr char name[] = "Drawing2";

  using BaseBehavior::BaseBehavior;

  void handleDrawComponent(ActorId actorId, const Drawing2Component &component) const;

private:
  Lv &lv { Lv::getInstance() };
};
