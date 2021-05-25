#include "variables.h"

#include "behaviors/all.h"


//
// Reading
//

void Variable::read(Reader &reader) {
  if (auto scene = reader.getScene()) {
    if (auto variableId = reader.str()) {
      auto &variables = scene->getVariables();
      token = variables.map.getToken(*variableId);
    }
  }
}

void Variables::read(Reader &reader) {
  map = {};
  byName.clear();
  reader.each([&]() {
    auto variableId = reader.str("id");
    if (!variableId) {
      return;
    }
    auto nameCStr = reader.str("name");
    if (!nameCStr) {
      return;
    }
    auto name = std::string(*nameCStr);
    auto token = map.getToken(*variableId);
    map.insert(token, MapElem(name, reader.num("initialValue", 0)));
    byName.insert_or_assign(std::move(name), Variable { token });
  });
}


//
// Get, set
//

void Variables::set(Variable variable, ExpressionValue value) {
  if (auto elem = map.lookup(variable.token)) {
    set(variable, *elem, value);
  }
}

void Variables::reset(Variable variable) {
  if (auto elem = map.lookup(variable.token)) {
    set(variable, *elem, elem->initialValue);
  }
}

void Variables::resetAll() {
  map.forEach([&](Map::Token token, MapElem &elem) {
    set(Variable(token), elem, elem.initialValue);
  });
}

void Variables::set(Variable variable, MapElem &elem, ExpressionValue value) {
  if (elem.value != value) {
    elem.value = value;
    if (scene) {
      auto &rulesBehavior = scene->getBehaviors().byType<RulesBehavior>();
      rulesBehavior.fireVariablesTriggers(variable, value);
    }
  }
}
