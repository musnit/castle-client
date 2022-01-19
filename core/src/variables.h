#pragma once

#include "precomp.h"

#include "expressions/value.h"
#include "archive.h"


class Scene; // Forward declaration because it `#include`s us too

class Variables {
  // Manages state of deck-level variables. New variables can be defined, and values of existing
  // variables updated or queried.
  //
  // This isn't a behavior because it doesn't have per-actor data and deck-level variable state
  // needs to outlive the scene.

  struct MapElem {
    std::string name;
    std::string variableId;
    ExpressionValue initialValue;
    ExpressionValue value = initialValue;

    MapElem(std::string name_, std::string variableId_, ExpressionValue initialValue_);
  };
  using Map = TokenMap<MapElem>;

public:
  Variables(const Variables &) = delete; // Prevent accidental copies
  Variables &operator=(const Variables &) = delete;
  Variables(Variables &&) = default; // Allow moves
  Variables &operator=(Variables &&) = default;

  Variables() = default;
  ~Variables() = default;

  friend class Editor;

  struct Variable {
    // For storing variable references at runtime (eg. in rule elements or other behaviors). Enables
    // fast lookups and deduplicates string data.

    Variable() = default;

    bool operator==(const Variable &other) const;

  public:
    void read(Reader &reader);
    void write(Writer &writer) const;

  private:
    friend class Variables;

    Map::Token token;

    explicit Variable(Map::Token token_);
  };


  // Scene linking (for firing triggers)

  void linkScene(Scene *scene_);
  void unlinkScene(Scene *scene_);


  // Read

  void read(Reader &reader); // Removes all existing variables and reads new ones


  // Get / set

  const ExpressionValue &get(Variable variable) const; // Default `ExpressionValue` if no such
  std::optional<ExpressionValue> get(const std::string &name) const;
  const std::optional<std::string> getName(Variable variable) const;
  void set(Variable variable, ExpressionValue value);
  void reset(Variable variable);
  void resetAll();
  template<typename F>
  void forEach(F &&f) const; // `F` takes `(const char *name, const ExpressionValue &)`
  template<typename F>
  void forEachElem(F &&f) const; // `F` takes `(const Variables::MapElem &elem)`


private:
  Map map; // NOTE: Keyed by variable id, not name
  std::unordered_map<std::string, Variable> byName;

  Scene *scene = nullptr;


  void set(Variable variable, MapElem &elem, ExpressionValue value);
};

using Variable = Variables::Variable;


// Inlined implementations

inline Variables::MapElem::MapElem(
    std::string name_, std::string variableId_, ExpressionValue initialValue_)
    : name(std::move(name_))
    , variableId(std::move(variableId_))
    , initialValue(initialValue_) {
}

inline bool Variable::operator==(const Variable &other) const {
  return token == other.token;
}

inline Variable::Variable(Variables::Map::Token token_)
    : token(token_) {
}

inline void Variables::linkScene(Scene *scene_) {
  scene = scene_;
}

inline void Variables::unlinkScene(Scene *scene_) {
  if (scene == scene_) {
    scene = nullptr;
  }
}

inline const ExpressionValue &Variables::get(Variable variable) const {
  if (auto elem = map.lookup(variable.token)) {
    return elem->value;
  } else {
    static ExpressionValue empty;
    return empty;
  }
}

inline std::optional<ExpressionValue> Variables::get(const std::string &variable) const {
  if (auto found = byName.find(variable); found != byName.end()) {
    return get(found->second);
  } else {
    return std::nullopt;
  }
}

inline const std::optional<std::string> Variables::getName(Variable variable) const {
  if (auto elem = map.lookup(variable.token)) {
    return elem->name;
  } else {
    return std::nullopt;
  }
}

template<typename F>
void Variables::forEach(F &&f) const {
  map.forEach([&](Map::Token token, const MapElem &elem) {
    f(elem.name.c_str(), elem.value);
  });
}

template<typename F>
void Variables::forEachElem(F &&f) const {
  map.forEach([&](Map::Token token, const MapElem &elem) {
    f(elem);
  });
}
