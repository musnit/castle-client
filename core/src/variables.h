#pragma once

#include "precomp.h"

#include "expressions/value.h"
#include "archive.h"


class Variables {
  // Manages state of deck-level variables. New variables can be defined, and values of existing
  // variables updated or queried.
  //
  // This isn't a behavior because it doesn't have per-actor data and deck-level variable state
  // needs to outlive the scene.

  struct MapElem {
    std::string name;
    ExpressionValue initialValue;
    ExpressionValue value = initialValue;
  };
  using Map = TokenMap<MapElem>;

public:
  Variables(const Variables &) = delete; // Prevent accidental copies
  Variables &operator=(const Variables &) = delete;
  Variables(Variables &&) = default; // Allow moves
  Variables &operator=(Variables &&) = default;

  Variables() = default;
  ~Variables() = default;

  struct Variable {
    // For storing variable references at runtime (eg. in rule elements or other behaviors). Enables
    // fast lookups and deduplicates string data.

    Variable() = default;

    bool operator==(const Variable &other) const;

    void read(Reader &reader);

  private:
    friend class Variables;

    Map::Token token;

    explicit Variable(Map::Token token_);
  };


  // Read

  void read(Reader &reader); // Removes all existing variables and reads new ones


  // Get / set

  ExpressionValue get(Variable variable) const; // Default `ExpressionValue` if no such variable
  void set(Variable variable, ExpressionValue value);


  // Perform

  void perform(double dt);


private:
  Map map; // NOTE: Keyed by variable id, not name
};

using Variable = Variables::Variable;


// Inlined implementation

inline Variable::Variable(Variables::Map::Token token_)
    : token(token_) {
}

inline ExpressionValue Variables::get(Variable variable) const {
  if (auto elem = map.lookup(variable.token)) {
    return elem->value;
  } else {
    return {};
  }
}

inline void Variables::set(Variable variable, ExpressionValue value) {
  if (auto elem = map.lookup(variable.token)) {
    elem->value = value;
  }
}
