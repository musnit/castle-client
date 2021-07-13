#include "edit_variables.h"

//
// Reading
//

void EditVariables::read(Reader &reader) {
  variables.clear();
  reader.each([&]() {
    auto variableIdCStr = reader.str("id");
    if (!variableIdCStr) {
      return;
    }
    auto nameCStr = reader.str("name");
    if (!nameCStr) {
      return;
    }
    auto name = std::string(*nameCStr);
    auto variableId = std::string(*variableIdCStr);
    variables.emplace(variableId, Variable(name, variableId, reader.num("initialValue", 0)));
  });
}

bool EditVariables::update(std::string variableId, std::string name, ExpressionValue initialValue) {
  auto maybeVariable = get(variableId);
  if (maybeVariable) {
    remove(variableId);
  }
  add(name, variableId, initialValue);
  return true;
}
