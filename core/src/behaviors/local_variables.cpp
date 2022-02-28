#include "local_variables.h"

#include "behaviors/all.h"


//
// Read, write
//

void LocalVariablesBehavior::handleReadComponent(
    ActorId actorId, LocalVariablesComponent &component, Reader &reader) {
  if (std::rand() % 2 == 0) {
    auto variableId = LocalVariableId { map.getToken("odd") };
    auto mapElem = map.lookup(variableId.token);
    if (!mapElem) {
      map.insert(variableId.token, {});
      mapElem = map.lookup(variableId.token);
    }
    if (mapElem) {
      if (mapElem->entries.contains(actorId)) {
        mapElem->entries.get(actorId).value = rand() * 2 + 1;
      } else {
        mapElem->entries.emplace(actorId, LocalVariableEntry { rand() * 2 + 1 });
      }
    }
  }
  if (std::rand() % 2 == 0) {
    auto variableId = LocalVariableId { map.getToken("even") };
    auto mapElem = map.lookup(variableId.token);
    if (!mapElem) {
      map.insert(variableId.token, {});
      mapElem = map.lookup(variableId.token);
    }
    if (mapElem) {
      if (mapElem->entries.contains(actorId)) {
        mapElem->entries.get(actorId).value = rand() * 2;
      } else {
        mapElem->entries.emplace(actorId, LocalVariableEntry { rand() * 2 });
      }
    }
  }
}

void LocalVariablesBehavior::handleWriteComponent(
    ActorId actorId, const LocalVariablesComponent &component, Writer &writer) const {
  writer.arr("localVariables", [&]() {
    map.forEach([&](LocalVariablesMap::Token token, const LocalVariablesMapElem &mapElem) {
      if (mapElem.entries.contains(actorId)) {
        writer.obj([&]() {
          writer.str("name", *map.getString(token));
          writer.num("value", mapElem.entries.get(actorId).value.as<double>());
        });
      }
    });
  });
}


//
// Perform
//

void LocalVariablesBehavior::handlePerform(double dt) {
  debugDisplay();
}


//
// Debug
//

void LocalVariablesBehavior::debugDisplay() {
  Debug::display("local variables:");
  forEachEnabledComponent([&](ActorId actorId, LocalVariablesComponent &component) {
    Debug::display("  actor {}:", actorId);
    map.forEach([&](LocalVariablesMap::Token token, LocalVariablesMapElem &mapElem) {
      if (mapElem.entries.contains(actorId)) {
        auto &entry = mapElem.entries.get(actorId);
        Debug::display("    {}: {}", *map.getString(token), entry.value.as<double>());
      }
    });
  });
}
