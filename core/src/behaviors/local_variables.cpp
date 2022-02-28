#include "local_variables.h"

#include "behaviors/all.h"
#include "engine.h"


//
// Enable, disable
//

void LocalVariablesBehavior::handleDisableComponent(
    ActorId actorId, LocalVariablesComponent &component, bool removeActor) {
  map.forEach([&](LocalVariablesMap::Token token, LocalVariablesMapElem &mapElem) {
    if (mapElem.entries.contains(actorId)) {
      mapElem.entries.remove(actorId);
    }
  });
}


//
// Read, write
//

void LocalVariablesBehavior::handleReadComponent(
    ActorId actorId, LocalVariablesComponent &component, Reader &reader) {
  auto didRead = false;
  reader.arr("localVariables", [&]() {
    didRead = true;
    reader.each([&]() {
      auto maybeVariableName = reader.str("name");
      if (!maybeVariableName) {
        return;
      }
      auto variableName = *maybeVariableName;
      auto variableValue = reader.num("value", 0);

      // TODO: Factor below into `set(name, value)` to reuse in rules
      auto variableId = LocalVariableId { map.getToken(variableName) };
      auto mapElem = map.lookup(variableId.token);
      if (!mapElem) {
        map.insert(variableId.token, {});
        mapElem = map.lookup(variableId.token);
      }
      if (mapElem) {
        if (mapElem->entries.contains(actorId)) {
          mapElem->entries.get(actorId).value = variableValue;
        } else {
          mapElem->entries.emplace(actorId, LocalVariableEntry { variableValue });
        }
      }
    });
  });

  if (!didRead) {
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


//
// Edit
//

struct EditorChangeLocalVariablesReceiver {
  inline static const BridgeRegistration<EditorChangeLocalVariablesReceiver> registration {
    "EDITOR_CHANGE_LOCAL_VARIABLES"
  };

  struct Params {
    Reader *reader = nullptr;
    void read(Reader &reader_) {
      reader = &reader_;
    }
  } params;

  void receive(Engine &engine) {
    if (!engine.getIsEditing()) {
      return;
    }
    auto editor = engine.maybeGetEditor();
    if (!editor->hasScene()) {
      return;
    }
    auto &scene = editor->getScene();

    auto actorId = editor->getSelection().firstSelectedActorId();
    if (actorId == nullActor) {
      return;
    }
    auto isGhost = editor->getSelection().isGhostActorsSelected();

    auto &localVariablesBehavior = scene.getBehaviors().byType<LocalVariablesBehavior>();
    auto component = localVariablesBehavior.maybeGetComponent(actorId);
    if (!component) {
      component = &localVariablesBehavior.addComponent(actorId);
    }
    // TODO: Add undo by writing current value to archive
    auto &reader = *params.reader;
    reader.obj("params", [&]() {
      localVariablesBehavior.handleDisableComponent(actorId, *component, false);
      localVariablesBehavior.handleReadComponent(actorId, *component, reader);
      if (isGhost) {
        editor->updateBlueprint(actorId, {});
      }
      editor->setSelectedComponentStateDirty(LocalVariablesBehavior::behaviorId);
    });
  }
};
