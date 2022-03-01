#pragma once

#include "precomp.h"

#include "behaviors/base.h"
#include "props.h"


//#define ENABLE_LOCAL_VARIABLES


//
// Play storage
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

  // Only present when editing
  struct EditData {
    struct LocalVariable {
      std::string name;
      ExpressionValue value;
    };
    SmallVector<LocalVariable, 4> localVariables;
  };
  std::unique_ptr<EditData> editData;
};

class LocalVariablesBehavior
    : public BaseBehavior<LocalVariablesBehavior, LocalVariablesComponent> {
public:
  static constexpr auto name = "LocalVariables";
  static constexpr auto behaviorId = 23;
  static constexpr auto displayName = "LocalVariables";
  static constexpr auto allowsDisableWithoutRemoval = false;

  using BaseBehavior::BaseBehavior;

  void handleDisableComponent(
      ActorId actorId, LocalVariablesComponent &component, bool removeActor);

  void handleReadComponent(ActorId actorId, LocalVariablesComponent &component, Reader &reader);
  void handleWriteComponent(
      ActorId actorId, const LocalVariablesComponent &component, Writer &writer) const;

  void handlePerform(double dt);


  void debugDisplay();


private:
  // Only present during play
  LocalVariablesMap map;
};
