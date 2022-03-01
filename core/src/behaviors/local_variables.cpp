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
  auto isEditing = getScene().getIsEditing();
  if (isEditing) {
    component.editData = std::make_unique<LocalVariablesComponent::EditData>();
  }
  reader.arr("localVariables", [&]() {
    reader.each([&]() {
      auto maybeVariableName = reader.str("name");
      if (!maybeVariableName) {
        return;
      }
      auto variableName = *maybeVariableName;
      auto variableValue = reader.num("value", 0);

      if (isEditing) {
        component.editData->localVariables.push_back({ variableName, variableValue });
      } else {
        // TODO: Factor below into `set(variableId, value)` to reuse in rules
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
      }
    });
  });
}

void LocalVariablesBehavior::handleWriteComponent(
    ActorId actorId, const LocalVariablesComponent &component, Writer &writer) const {
  writer.arr("localVariables", [&]() {
    for (auto &localVariable : component.editData->localVariables) {
      writer.obj([&]() {
        writer.str("name", localVariable.name);
        writer.num("value", localVariable.value.as<double>());
      });
    }
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
    if (component.editData) {
      for (auto &localVariable : component.editData->localVariables) {
        Debug::display("    {}: {}", localVariable.name, localVariable.value.as<double>());
      }
    } else {
      map.forEach([&](LocalVariablesMap::Token token, LocalVariablesMapElem &mapElem) {
        if (mapElem.entries.contains(actorId)) {
          auto &entry = mapElem.entries.get(actorId);
          Debug::display("    {}: {}", *map.getString(token), entry.value.as<double>());
        }
      });
    }
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
    // Get scene and actor id
    if (!engine.getIsEditing()) {
      return;
    }
    auto editor = engine.maybeGetEditor();
    if (!editor->hasScene()) {
      return;
    }
    auto &scene = editor->getScene();
    auto actorId = editor->getSelection().firstSelectedActorId();
    if (actorId == nullActor || !scene.hasActor(actorId)) {
      return;
    }

    // Get behavior and component
    auto &localVariablesBehavior = scene.getBehaviors().byType<LocalVariablesBehavior>();
    auto component = localVariablesBehavior.maybeGetComponent(actorId);
    if (!component) {
      component = &localVariablesBehavior.addComponent(actorId);
    }

    // Save old and new data so we can undo / redo
    std::string commandDescription;
    std::shared_ptr<Archive> oldArchive = std::make_shared<Archive>();
    oldArchive->write([&](Writer &writer) {
      localVariablesBehavior.handleWriteComponent(actorId, *component, writer);
    });
    std::shared_ptr<Archive> newArchive = std::make_shared<Archive>();
    newArchive->write([&](Writer &writer) {
      params.reader->obj("params", [&]() {
        commandDescription = params.reader->str("commandDescription", "");
        writer.setValue(*params.reader->jsonValue());
      });
    });

    // Common function to use in undo / redo
    static auto setLocalVariables = [](Editor &editor, ActorId actorId, Archive &archive) {
      auto &scene = editor.getScene();
      auto &localVariablesBehavior = scene.getBehaviors().byType<LocalVariablesBehavior>();
      auto component = localVariablesBehavior.maybeGetComponent(actorId);
      if (!component) {
        component = &localVariablesBehavior.addComponent(actorId);
      }
      archive.read([&](Reader &reader) {
        localVariablesBehavior.handleReadComponent(actorId, *component, reader);
      });
      if (scene.isGhost(actorId)) {
        editor.updateBlueprint(actorId, {});
      }
      editor.setSelectedComponentStateDirty(LocalVariablesBehavior::behaviorId);
    };

    // Execute command
    Commands::Params commandParams;
    commandParams.coalesce = true;
    editor->getCommands().execute(
        commandDescription, commandParams,
        [actorId, newArchive = std::move(newArchive)](Editor &editor, bool) {
          setLocalVariables(editor, actorId, *newArchive);
        },
        [actorId, oldArchive = std::move(oldArchive)](Editor &editor, bool) {
          setLocalVariables(editor, actorId, *oldArchive);
        });
  }
};
