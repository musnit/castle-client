#include "variables.h"

#include "behaviors/rules.h"


//
// Reading
//

void Variable::read(Reader &reader) {
  if (auto scene = reader.getScene()) {
    if (auto variableId = reader.str()) {
      auto &byVariableId = scene->getVariables().byVariableId;
      if (auto found = byVariableId.find(*variableId); found != byVariableId.end()) {
        *this = found->second;
      }
    }
  }
}

void Variables::read(Reader &reader) {
  map = {};
  byVariableId.clear();
  reader.each([&]() {
    auto variableId = reader.str("id");
    if (!variableId) {
      return;
    }
    auto name = reader.str("name");
    if (!name) {
      return;
    }

    auto token = map.getToken(*name);
    map.insert(token, MapElem { reader.num("initialValue", 0) });
    byVariableId.insert_or_assign(*variableId, Variable { token });
  });
}


//
// Perform
//

void Variables::perform(double dt) {
  Debug::display("variables:");
  for (auto [variableId, variable] : byVariableId) {
    if (auto name = map.getString(variable.token)) {
      if (auto elem = map.lookup(variable.token)) {
        Debug::display("  {}: {}", *name, elem->value.as<float>());
      }
    }
  }
}
