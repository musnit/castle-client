#include "variables.h"

#include "behaviors/all.h"


//
// Triggers
//

struct VariableReachesValueTrigger : BaseTrigger {
  inline static const RuleRegistration<VariableReachesValueTrigger, RulesBehavior> registration {
    "variable reaches value"
  };

  struct Params {
    PROP(Variable, variableId);
    PROP(std::string, comparison) = "equal";
    PROP(double, value) = 0;
  } params;
};

struct VariableChangesTrigger : BaseTrigger {
  inline static const RuleRegistration<VariableChangesTrigger, RulesBehavior> registration {
    "variable changees"
  };

  struct Params {
    PROP(Variable, variableId);
  } params;
};


//
// Responses
//

struct ResetVariableResponse : BaseResponse {
  inline static const RuleRegistration<ResetVariableResponse, RulesBehavior> registration {
    "reset variable"
  };

  struct Params {
    PROP(Variable, variableId);
  } params;

  void run(RuleContext &ctx) override {
    ctx.getScene().getVariables().reset(params.variableId());
  }
};

struct ResetAllVariablesResponse : BaseResponse {
  inline static const RuleRegistration<ResetAllVariablesResponse, RulesBehavior> registration {
    "reset all variables"
  };

  struct Params {
  } params;

  void run(RuleContext &ctx) override {
    ctx.getScene().getVariables().resetAll();
  }
};

struct SetVariableResponse : BaseResponse {
  inline static const RuleRegistration<SetVariableResponse, RulesBehavior> registration {
    "set variable"
  };

  struct Params {
    PROP(Variable, variableId);
    PROP(ExpressionRef, setToValue);
    PROP(bool, relative);
  } params;

  void run(RuleContext &ctx) override {
    auto variable = params.variableId();
    auto &variables = ctx.getScene().getVariables();
    auto value = params.setToValue().eval(ctx);
    if (params.relative() && value.is<double>()) {
      variables.set(variable, variables.get(variable).as<double>() + value.as<double>());
    } else {
      variables.set(variable, value);
    }
  }
};

struct VariableMeetsConditionResponse : BaseResponse {
  inline static const RuleRegistration<VariableMeetsConditionResponse, RulesBehavior> registration {
    "variable meets condition"
  };

  struct Params {
    PROP(Variable, variableId);
    PROP(std::string, comparison);
    PROP(ExpressionRef, value);
  } params;

  bool eval(RuleContext &ctx) override {
    auto &variables = ctx.getScene().getVariables();
    auto value = params.value().eval(ctx);
    return variables.get(params.variableId()).compare(params.comparison(), value);
  }
};


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
    // PERF: Scans through /all/ variable-related triggers to find the ones pertaining to this
    //       variable. Maybe keep a mapping from variable somewhere? Tricky because we have to
    //       add / remove as actors are added / removed -- maybe should just do it in rules
    //       behavior.
    auto &rulesBehavior = scene->getBehaviors().byType<RulesBehavior>();
    rulesBehavior.fireAllIf<VariableChangesTrigger>(
        {}, [&](ActorId actorId, const VariableChangesTrigger &trigger) {
          return trigger.params.variableId() == variable;
        });
    rulesBehavior.fireAllIf<VariableReachesValueTrigger>(
        {}, [&](ActorId actorId, const VariableReachesValueTrigger &trigger) {
          return trigger.params.variableId() == variable
              && value.compare(trigger.params.comparison(), trigger.params.value());
        });
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
