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
  reader.each([&]() {
    auto variableId = reader.str("id");
    if (!variableId) {
      return;
    }
    auto name = reader.str("name");
    if (!name) {
      return;
    }
    auto token = map.getToken(*variableId);
    map.insert(token, MapElem(*name, reader.num("initialValue", 0)));
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
  elem.value = value;
  if (scene) {
    auto &rulesBehavior = scene->getBehaviors().byType<RulesBehavior>();
    rulesBehavior.fireVariablesTriggers(variable, value);
  }
}


//
// Perform
//

void Variables::perform(double dt) {
  Debug::display("variables:");
  map.forEach([&](Map::Token token, MapElem &elem) {
    Debug::display("  {}: {}", elem.name, elem.value.as<float>());
  });
}
