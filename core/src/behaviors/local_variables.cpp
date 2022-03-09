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

void LocalVariableId::read(Reader &reader) {
  if (auto str = reader.str(); str && (*str)[0] != '\0') {
    name = *str;
    if (auto scene = reader.getScene(); scene && !scene->getIsEditing()) {
      auto &localVariablesBehavior = scene->getBehaviors().byType<LocalVariablesBehavior>();
      token = localVariablesBehavior.map.getToken(name.c_str());
    }
  }
}

void LocalVariableId::write(Writer &writer) const {
  writer.setStr(name);
}

void LocalVariablesBehavior::handleReadComponent(
    ActorId actorId, LocalVariablesComponent &component, Reader &reader) {
  auto isEditing = getScene().getIsEditing();

  // Reset edit data
  if (isEditing) {
    if (component.editData) {
      *component.editData = {}; // Prevent new allocation if already allocated
    } else {
      component.editData = std::make_unique<LocalVariablesComponent::EditData>();
    }
  }

  // Read initial values
  reader.arr("localVariables", [&]() {
    reader.each([&]() {
      auto maybeName = reader.str("name");
      if (!maybeName) {
        return;
      }
      auto name = *maybeName;
      auto value = reader.num("value", 0);

      if (isEditing) {
        component.editData->localVariables.push_back({ name, value });
      } else {
        set(actorId, LocalVariableId { map.getToken(name) }, value);
      }
    });
  });
}

static auto undoRedoCount = 0;

void LocalVariablesBehavior::handleWriteComponent(
    ActorId actorId, const LocalVariablesComponent &component, Writer &writer) const {
  if (component.editData) {
    writer.arr("localVariables", [&]() {
      for (auto &localVariable : component.editData->localVariables) {
        writer.obj([&]() {
          writer.str("name", localVariable.name);
          writer.num("value", localVariable.value.as<double>());
        });
      }
    });
    writer.num("undoRedoCount", undoRedoCount);
  }
}


//
// Perform
//

void LocalVariablesBehavior::handlePerform(double dt) {
  debugDisplay();
}


//
// Get, set
//

ExpressionValue LocalVariablesBehavior::get(
    ActorId actorId, const LocalVariableId &localVariableId) const {
  if (auto mapElem = map.lookup(localVariableId.token)) {
    if (mapElem->entries.contains(actorId)) {
      return mapElem->entries.get(actorId).value;
    }
  }
  return {};
}

void LocalVariablesBehavior::set(
    ActorId actorId, const LocalVariableId &localVariableId, ExpressionValue value) {
  auto mapElem = map.lookup(localVariableId.token);
  if (!mapElem) {
    map.insert(localVariableId.token, {});
    mapElem = map.lookup(localVariableId.token);
  }
  if (mapElem) {
    if (mapElem->entries.contains(actorId)) {
      mapElem->entries.get(actorId).value = value;
    } else {
      mapElem->entries.emplace(actorId, LocalVariableEntry { value });
    }
  }
}


//
// Debug
//

void LocalVariablesBehavior::debugDisplay() {
#if 1
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
#endif
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
      component->disabled = false;
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
        component->disabled = false;
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
        [actorId, newArchive = std::move(newArchive)](Editor &editor, bool live) {
          setLocalVariables(editor, actorId, *newArchive);
          if (!live) {
            ++undoRedoCount;
          }
        },
        [actorId, oldArchive = std::move(oldArchive)](Editor &editor, bool live) {
          setLocalVariables(editor, actorId, *oldArchive);
          if (!live) {
            ++undoRedoCount;
          }
        });
  }
};
