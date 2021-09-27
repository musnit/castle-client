#pragma once

#include "precomp.h"

#include "expressions/value.h"
#include "archive.h"

class Bridge;

class EditVariables {
  // Manages editor state of deck-level variables.
  // Unlike `Variables`, allows removal and renaming of variables, but doesn't run any Rules
  // or maintain any relationship with a Scene.

  struct Variable {
    std::string name;
    std::string variableId;
    ExpressionValue initialValue;

    Variable(std::string name_, std::string variableId_, ExpressionValue initialValue_);
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
  bool add(std::string name, std::string variableId, ExpressionValue initialValue);
  bool remove(const std::string &variableId);
  void clear();
  bool update(std::string variableId, std::string name, ExpressionValue initialValue);

  template<typename F>
  void forEach(F &&f) const; // `F` takes `(const EditVariables::Variable &elem)`

  void sendVariablesData(Bridge &bridge, bool isChanged);

private:
  // use a vector so that the order stays consistent in the editor
  std::vector<Variable> variables;
};


inline EditVariables::Variable::Variable(
    std::string name_, std::string variableId_, ExpressionValue initialValue_)
    : name(std::move(name_))
    , variableId(std::move(variableId_))
    , initialValue(initialValue_) {
}

inline std::optional<EditVariables::Variable> EditVariables::get(std::string &variableId) {
  for (auto &variable : variables) {
    if (variable.variableId == variableId) {
      return variable;
    }
  }
  return std::nullopt;
}

inline bool EditVariables::add(
    std::string name, std::string variableId, ExpressionValue initialValue) {
  auto existing = get(variableId);
  if (!existing) {
    variables.emplace_back(EditVariables::Variable(std::move(name), variableId, initialValue));
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
