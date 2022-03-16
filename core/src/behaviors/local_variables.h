#pragma once

#include "precomp.h"

#include "behaviors/base.h"
#include "props.h"


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
  std::string name = "";

  void read(Reader &reader);
  void write(Writer &writer) const;

  bool operator==(const LocalVariableId &other) const;
};

struct VariableRef {
  Variable variableId;
  LocalVariableId localVariableId;

  void read(Reader &reader);
  void write(Writer &writer) const;

  bool isLocal() const;
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


  const ExpressionValue &get(ActorId actorId, const LocalVariableId &localVariableId) const;
  void set(ActorId actorId, const LocalVariableId &localVariableId, ExpressionValue value,
      bool fireTriggers = true);


  void debugDisplay();


private:
  friend struct LocalVariableId;
  friend struct LocalVariableExpression;

  // Only present during play
  LocalVariablesMap map;
};


// Inlined implementations

inline bool VariableRef::isLocal() const {
  return !(variableId.token.index >= 0);
}

inline bool LocalVariableId::operator==(const LocalVariableId &other) const {
  return token == other.token;
}
