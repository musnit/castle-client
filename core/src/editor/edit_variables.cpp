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
    auto lifetimeCStr = reader.str("lifetime");

    auto name = std::string(*nameCStr);
    auto variableId = std::string(*variableIdCStr);
    auto lifetime = Variables::Lifetime::Deck;
    if (lifetimeCStr && std::string(*lifetimeCStr) == "user") {
      lifetime = Variables::Lifetime::User;
    }

    variables.emplace_back(Variable(name, variableId, reader.num("initialValue", 0), lifetime));
  });
}

void EditVariables::write(Writer &writer) const {
  forEach([&](const Variable &variable) {
    writer.obj([&]() {
      writer.str("id", variable.variableId);
      writer.str("name", variable.name);
      writer.num("initialValue", variable.initialValue.as<double>());
      writer.str("lifetime", Variables::lifetimeEnumToString(variable.lifetime));
    });
  });
}

void EditVariables::update(const std::string &variableId, std::string name,
    ExpressionValue initialValue, Variables::Lifetime lifetime) {
  for (auto &variable : variables) {
    if (variable.variableId == variableId) {
      variable = EditVariables::Variable(std::move(name), variableId, initialValue, lifetime);
      return;
    }
  }
  add(std::move(name), variableId, initialValue, lifetime);
  return;
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
    PROP(std::string, lifetime);
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
    auto lifetime = Variables::lifetimeStringToEnum(params.lifetime());

    if (action == "add") {
      editor->getCommands().execute(
          "add variable", commandParams,
          [variableId, name, initialValue, lifetime](Editor &editor, bool) {
            editor.getVariables().add(name, variableId, initialValue, lifetime);
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
        auto oldLifetime = existing->lifetime;
        editor->getCommands().execute(
            "remove variable", commandParams,
            [variableId](Editor &editor, bool) {
              editor.getVariables().remove(variableId);
              editor.getVariables().sendVariablesData(editor.getBridge(), true);
            },
            [variableId, oldName, oldInitialValue, oldLifetime](Editor &editor, bool) {
              editor.getVariables().add(oldName, variableId, oldInitialValue, oldLifetime);
              editor.getVariables().sendVariablesData(editor.getBridge(), true);
            });
      }
    } else if (action == "update") {
      auto existing = editor->getVariables().get(variableId);
      if (existing) {
        auto oldName = existing->name;
        auto oldInitialValue = existing->initialValue;
        auto oldLifetime = existing->lifetime;
        editor->getCommands().execute(
            "change variable", commandParams,
            [variableId, name, initialValue, lifetime](Editor &editor, bool) {
              editor.getVariables().update(variableId, name, initialValue, lifetime);
              editor.getVariables().sendVariablesData(editor.getBridge(), true);
            },
            [variableId, oldName, oldInitialValue, oldLifetime](Editor &editor, bool) {
              editor.getVariables().update(variableId, oldName, oldInitialValue, oldLifetime);
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
    PROP(std::string, lifetime);
  };
  PROP(std::vector<VariableData>, variables);
  PROP(bool, isChanged);
};

void EditVariables::sendVariablesData(Bridge &bridge, bool isChanged) {
  EditorVariablesEvent ev;
  forEach([&](const EditVariables::Variable &elem) {
    EditorVariablesEvent::VariableData data { elem.variableId, elem.name,
      elem.initialValue.as<double>(), Variables::lifetimeEnumToString(elem.lifetime) };
    ev.variables().push_back(data);
  });
  ev.isChanged = isChanged;
  bridge.sendEvent("EDITOR_VARIABLES", ev);
}
