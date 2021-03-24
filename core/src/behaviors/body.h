#pragma once

#include "precomp.h"

#include "behaviors/base.h"


struct BodyComponent : BaseComponent {
  b2Body *body;
};

class BodyBehavior : public BaseBehavior<BodyBehavior, BodyComponent> {

};
