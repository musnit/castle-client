#pragma once

#include "precomp.h"

#include "expressions/value.h"
#include "archive.h"
#include "variables.h"

class Bridge;

class EditVariables {
  // Manages editor state of deck-level variables.
  // Unlike `Variables`, allows removal and renaming of variables, but doesn't run any Rules
  // or maintain any relationship with a Scene.

  struct Variable {
    std::string name;
    std::string variableId;
    ExpressionValue initialValue;
    Variables::Lifetime lifetime;

    Variable(std::string name_, std::string variableId_, ExpressionValue initialValue_,
        Variables::Lifetime lifetime_);
  };

public:
  EditVariables(const EditVariables &) = delete; // Prevent accidental copies
  EditVariables &operator=(const EditVariables &) = delete;
  EditVariables(EditVariables &&) = default; // Allow moves
  EditVariables &operator=(EditVariables &&) = default;

  EditVariables() = default;
  ~EditVariables() = default;

  friend class Editor;


  // Read / write

  void read(Reader &reader); // Removes all existing variables and reads new ones
  void write(Writer &writer) const;


  // Get or update variables

  std::optional<Variable> get(std::string &variableId);
  std::optional<Variable> getByName(std::string &name) const;
  bool add(std::string name, std::string variableId, ExpressionValue initialValue,
      Variables::Lifetime lifetime);
  bool remove(const std::string &variableId);
  void clear();
  void update(const std::string &variableId, std::string name, ExpressionValue initialValue,
      Variables::Lifetime lifetime);

  template<typename F>
  void forEach(F &&f) const; // `F` takes `(const EditVariables::Variable &elem)`

  void sendVariablesData(Bridge &bridge, bool isChanged);

private:
  // use a vector so that the order stays consistent in the editor
  std::vector<Variable> variables;
};


inline EditVariables::Variable::Variable(std::string name_, std::string variableId_,
    ExpressionValue initialValue_, Variables::Lifetime lifetime_)
    : name(std::move(name_))
    , variableId(std::move(variableId_))
    , initialValue(initialValue_)
    , lifetime(lifetime_) {
}

inline std::optional<EditVariables::Variable> EditVariables::get(std::string &variableId) {
  for (auto &variable : variables) {
    if (variable.variableId == variableId) {
      return variable;
    }
  }
  return std::nullopt;
}

inline std::optional<EditVariables::Variable> EditVariables::getByName(std::string &name) const {
  for (auto &variable : variables) {
    if (variable.name == name) {
      return variable;
    }
  }
  return std::nullopt;
}

inline bool EditVariables::add(std::string name, std::string variableId,
    ExpressionValue initialValue, Variables::Lifetime lifetime) {
  auto existing = get(variableId);
  if (!existing) {
    variables.emplace_back(
        EditVariables::Variable(std::move(name), variableId, initialValue, lifetime));
    return true;
  }
  return false;
}

inline bool EditVariables::remove(const std::string &variableId) {
  for (auto iter = variables.begin(); iter != variables.end(); iter++) {
    if (iter->variableId == variableId) {
      variables.erase(iter);
      return true;
    }
  }
  return false;
}

inline void EditVariables::clear() {
  variables.clear();
}

template<typename F>
void EditVariables::forEach(F &&f) const {
  for (auto &variable : variables) {
    f(variable);
  }
}
