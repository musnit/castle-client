#include "edit_variables.h"
#include "engine.h"

//
// Read / write
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

void EditVariables::write(Writer &writer) const {
  forEach([&](const Variable &variable) {
    writer.obj([&]() {
      writer.str("id", variable.variableId);
      writer.str("name", variable.name);
      writer.num("initialValue", variable.initialValue.as<double>());
    });
  });
}

bool EditVariables::update(std::string variableId, std::string name, ExpressionValue initialValue) {
  auto maybeVariable = get(variableId);
  if (maybeVariable) {
    remove(variableId);
  }
  add(std::move(name), variableId, initialValue);
  return true;
}

//
// Events
//

struct EditorChangeVariablesReceiver {
  inline static const BridgeRegistration<EditorChangeVariablesReceiver> registration {
    "EDITOR_CHANGE_VARIABLES"
  };

  struct Params {
    PROP(std::string, action);
    PROP(std::string, variableId);
    PROP(std::string, name);
    PROP(double, initialValue);
  } params;

  void receive(Engine &engine) {
    if (!engine.getIsEditing()) {
      return;
    }
    auto action = params.action();
    auto editor = engine.maybeGetEditor();

    Commands::Params commandParams;
    commandParams.coalesce = true;
    commandParams.coalesceLastOnly = false;

    auto variableId = params.variableId();
    auto name = params.name();
    auto initialValue = params.initialValue();

    if (action == "add") {
      editor->getCommands().execute(
          "add variable", commandParams,
          [variableId, name, initialValue](Editor &editor, bool) {
            editor.getVariables().add(name, variableId, initialValue);
            editor.getVariables().sendVariablesData(editor.getBridge(), true);
          },
          [variableId](Editor &editor, bool) {
            editor.getVariables().remove(variableId);
            editor.getVariables().sendVariablesData(editor.getBridge(), true);
          });
    } else if (action == "remove") {
      auto existing = editor->getVariables().get(variableId);
      if (existing) {
        auto oldName = existing->name;
        auto oldInitialValue = existing->initialValue;
        editor->getCommands().execute(
            "remove variable", commandParams,
            [variableId](Editor &editor, bool) {
              editor.getVariables().remove(variableId);
              editor.getVariables().sendVariablesData(editor.getBridge(), true);
            },
            [variableId, oldName, oldInitialValue](Editor &editor, bool) {
              editor.getVariables().add(oldName, variableId, oldInitialValue);
              editor.getVariables().sendVariablesData(editor.getBridge(), true);
            });
      }
    } else if (action == "update") {
      auto existing = editor->getVariables().get(variableId);
      if (existing) {
        auto oldName = existing->name;
        auto oldInitialValue = existing->initialValue;
        editor->getCommands().execute(
            "change variable", commandParams,
            [variableId, name, initialValue](Editor &editor, bool) {
              editor.getVariables().update(variableId, name, initialValue);
              editor.getVariables().sendVariablesData(editor.getBridge(), true);
            },
            [variableId, oldName, oldInitialValue](Editor &editor, bool) {
              editor.getVariables().update(variableId, oldName, oldInitialValue);
              editor.getVariables().sendVariablesData(editor.getBridge(), true);
            });
      }
    }
  }
};

struct EditorVariablesEvent {
  struct VariableData {
    PROP(std::string, variableId);
    PROP(std::string, name);
    PROP(double, initialValue);
  };
  PROP(std::vector<VariableData>, variables);
  PROP(bool, isChanged);
};

void EditVariables::sendVariablesData(Bridge &bridge, bool isChanged) {
  EditorVariablesEvent ev;
  forEach([&](const EditVariables::Variable &elem) {
    EditorVariablesEvent::VariableData data { elem.variableId, elem.name,
      elem.initialValue.as<double>() };
    ev.variables().push_back(data);
  });
  ev.isChanged = isChanged;
  bridge.sendEvent("EDITOR_VARIABLES", ev);
}
