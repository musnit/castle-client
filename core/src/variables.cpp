#include "variables.h"

#include "behaviors/all.h"
#include "rapidjson/writer.h"
#include "rapidjson/stringbuffer.h"
#include "api.h"

#define VARIABLE_FLUSH_INTERVAL 2.0

//
// Serialization
//

void Variable::write(Writer &writer) const {
  auto written = false;
  if (auto scene = writer.getScene()) {
    auto &variables = scene->getVariables();
    if (auto elem = variables.map.lookup(token)) {
      writer.str("id", elem->variableId);
      writer.str("name", elem->name);
      writer.num("initialValue", elem->initialValue.as<double>());
      writer.str("lifetime", Variables::lifetimeEnumToString(elem->lifetime));
      written = true;
    }
  }
  if (!written) {
    // TODO: better sentinel?
    writer.boolean("none", true);
  }
}


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
    auto lifetimeCStr = reader.str("lifetime");

    auto name = std::string(*nameCStr);
    auto token = map.getToken(*variableId);
    auto lifetime = Variables::Lifetime::Deck;
    if (lifetimeCStr && std::string(*lifetimeCStr) == "user") {
      lifetime = Variables::Lifetime::User;
    }

    auto initialValue = reader.num("initialValue", 0);
    auto value = reader.num("value");
    if (!value) {
      value = initialValue;
    }

    map.insert(token, MapElem(name, std::string(*variableId), initialValue, *value, lifetime));
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

  if (elem.lifetime == Variables::Lifetime::User) {
    serverVariablesDirty = true;
  }
}

//
// Update, flush
//

void Variables::update(double dt) {
  timeSinceLastUpdateSent += dt;

  if (serverVariablesDirty && timeSinceLastUpdateSent > VARIABLE_FLUSH_INTERVAL) {
    timeSinceLastUpdateSent = 0.0;
    serverVariablesDirty = false;
    flushServerVariables();
  }
}

void Variables::flushServerVariables() {
  if (!scene) {
    return;
  }

  auto deckId = scene->getDeckId();
  if (!deckId) {
    return;
  }

  Archive archive;
  archive.write([&](Archive::Writer &writer) {
    map.forEach([&](Map::Token token, MapElem &elem) {
      if (elem.lifetime == Variables::Lifetime::User) {
        writer.obj(elem.name, [&]() {
          writer.num("value", elem.value.as<double>());
        });
      }
    });
  });

  auto variablesJson = archive.toJson();

  rapidjson::StringBuffer sb;
  rapidjson::Writer<rapidjson::StringBuffer> writer(sb);
  writer.String(variablesJson.c_str(), variablesJson.size());
  auto variablesJsonEscaped = sb.GetString();

  API::graphql("mutation {\n  updateVariables(deckId: \"" + *deckId
          + "\", variables: " + variablesJsonEscaped + ")\n}",
      [=](APIResponse &response) {
      });
}
