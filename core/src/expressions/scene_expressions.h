#pragma once

#include "expression.h"
#include "behaviors/tags.h"
#include "behaviors/rules.h"

struct ActorRef {
  PROP(std::string, kind) = "self";
  PROP(Tag, tag);

  ActorId eval(RuleContext &ctx);
};
