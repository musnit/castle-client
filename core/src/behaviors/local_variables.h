#pragma once

#include "precomp.h"

#include "behaviors/base.h"
#include "props.h"


#ifndef NDEBUG
#define ENABLE_LOCAL_VARIABLES
#endif


//
// Storage
//

struct LocalVariableEntry {
  ExpressionValue value;
};

struct LocalVariablesMapElem {
  entt::storage<LocalVariableEntry> entries;
};

using LocalVariablesMap = TokenMap<LocalVariablesMapElem>;

struct LocalVariableId {
  LocalVariablesMap::Token token;
};


//
// Behavior
//

struct LocalVariablesComponent : BaseComponent {
  struct Props {
  } props;
};

class LocalVariablesBehavior
    : public BaseBehavior<LocalVariablesBehavior, LocalVariablesComponent> {
public:
  static constexpr auto name = "LocalVariables";
  static constexpr auto behaviorId = 23;
  static constexpr auto displayName = "LocalVariables";
  static constexpr auto allowsDisableWithoutRemoval = false;

  using BaseBehavior::BaseBehavior;


  void handleReadComponent(ActorId actorId, LocalVariablesComponent &component, Reader &reader);
  void handleWriteComponent(
      ActorId actorId, const LocalVariablesComponent &component, Writer &writer) const;

  void handlePerform(double dt);


  void debugDisplay();


private:
  LocalVariablesMap map;
};
