#include "variables.h"

#include "behaviors/rules.h"


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
// Perform
//

void Variables::perform(double dt) {
  Debug::display("variables:");
  map.forEach([&](Map::Token token, MapElem &elem) {
    Debug::display("  {}: {}", elem.name, elem.value.as<float>());
  });
}
