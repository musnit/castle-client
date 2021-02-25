import { getPaneData, sendDataPaneAction } from '../ghost/GhostUI';

export const formatVariableName = (name) => `\$${name}`;

export const formatTag = (tag) => `#${tag}`;

export const getVariableName = (variableId, variables) => {
  let variableName = '(none)';
  if (variableId && variableId !== 'none') {
    if (variables) {
      const selectedVar = variables.find((v) => v.id === variableId);
      if (selectedVar) {
        variableName = selectedVar.name;
      }
    }
  }
  return variableName;
};

const READABLE_OPERATORS = {
  equal: 'equals',
  'greater or equal': 'is greater than or equal to',
  'less or equal': 'is less than or equal to',
};
export const readableOperator = (o) => {
  return READABLE_OPERATORS[o] ?? o;
};

export const getInspectorBehaviors = (root) => {
  if (!root || !root.panes || !root.panes['sceneCreatorInspector']) return {};
  const element = root.panes['sceneCreatorInspector'];

  let behaviors, sendActions;
  if (element.children.count) {
    behaviors = {};
    sendActions = {};
    Object.entries(element.children).forEach(([key, child]) => {
      if (child.type === 'data') {
        const data = child.props.data;
        behaviors[data.name] = data;
        behaviors[data.name].lastReportedEventId = child.lastReportedEventId;
        sendActions[data.name] = (action, value) => sendDataPaneAction(element, action, value, key);
      }
    });
  }
  return {
    behaviors,
    behaviorActions: sendActions,
  };
};

export const getInspectorTags = (tags) => ({ tagToActorIds: tags?.properties.tagToActorIds });

export const getActiveTool = (root) => {
  if (!root || !root.panes || !root.panes['sceneCreatorTool']) {
    return { activeToolData: null, activeToolAction: null };
  }
  const element = root.panes['sceneCreatorTool'];

  if (element.children.count) {
    let result = null;
    Object.entries(element.children).forEach(([key, child]) => {
      if (child.type === 'data') {
        const data = child.props.data;

        result = {
          activeToolData: {
            ...data,
            lastReportedEventId: child.lastReportedEventId,
          },
          activeToolAction: (action, value) => sendDataPaneAction(element, action, value, key),
        };
      }
    });

    if (result) {
      return result;
    }
  }

  return { activeToolData: null, activeToolActions: null };
};

export const getTextActorsData = (root, isPlaying) => {
  let textActors, isTextActorSelected;
  if (root && root.panes) {
    const data = getPaneData(root.panes['sceneCreatorTextActors']);
    if (data) {
      textActors = data.textActors;
      isTextActorSelected =
        !isPlaying && Object.entries(textActors).some(([_, actor]) => actor.isSelected);
    }
  }
  return { textActors, isTextActorSelected };
};

export const getInspectorActions = (root) => {
  let inspectorActions,
    sendInspectorAction,
    applicableTools = [];
  if (root && root.panes) {
    const pane = root.panes.sceneCreatorInspectorActions;
    if (pane) {
      sendInspectorAction = (action, value) => sendDataPaneAction(pane, action, value);
      inspectorActions = getPaneData(pane);
      if (inspectorActions?.applicableTools) {
        Object.values(inspectorActions.applicableTools).forEach((value) => {
          applicableTools.push(value);
        });
      }
    }
  }
  return { inspectorActions, sendInspectorAction, applicableTools };
};

export const getInspectorRules = (root) => {
  const element = root?.panes ? root.panes['sceneCreatorRules'] : null;

  let rulesData, sendRuleAction;
  if (element?.children.count) {
    Object.entries(element.children).forEach(([key, child]) => {
      if (child.type === 'data') {
        const data = child.props.data;
        if (data.name === 'Rules') {
          rulesData = data;
        }
        sendRuleAction = (action, value) => sendDataPaneAction(element, action, value, key);
      }
    });
  }

  let rulesItems = [];
  if (rulesData) {
    // there's an issue with the lua bridge applying a diff to arrays,
    // make sure we don't have one here
    if (Array.isArray(rulesData.rules)) {
      throw new Error(`Expecting a dictionary of Rules, got an array.`);
    } else {
      rulesItems = Object.entries(rulesData.rules)
        .map(([index, rule]) => ({ ...rule, index }))
        .sort((a, b) => parseInt(b.index, 10) < parseInt(a.index, 10));
    }
  }

  return {
    data: rulesData,
    sendAction: sendRuleAction,
    items: rulesItems,
  };
};

export const promoteToExpression = (initialValue) => {
  const initialType = typeof initialValue;
  switch (initialType) {
    case 'object':
      return initialValue;
    case 'number':
    case 'boolean':
      // promote from primitive to object
      return {
        expressionType: 'number',
        returnType: 'number',
        params: { value: initialValue },
      };
    default:
      throw new Error(`Invalid expression: ${JSON.stringify(initialValue)}`);
  }
};

const makeActorRefSummary = (actorRef) => {
  let result = 'My own';
  if (actorRef?.kind === 'closest') {
    result = formatTag(actorRef.tag);
  } else if (actorRef?.kind === 'other') {
    result = `Other`;
  }
  return result;
};

const maybeExpressionParens = (str, depth) => (depth > 0 ? `(${str})` : str);

export const makeExpressionSummary = (expression, context, depth = 0) => {
  if (!expression?.expressionType) {
    if (typeof expression === 'number') {
      return Math.round((expression + Number.EPSILON) * 10000) / 10000;
    }
    return expression;
  }
  switch (expression.expressionType) {
    case 'number':
      return Math.round((expression.params.value + Number.EPSILON) * 10000) / 10000;
    case 'random': {
      let min = makeExpressionSummary(expression.params.min, context, depth + 1),
        max = makeExpressionSummary(expression.params.max, context, depth + 1);
      return maybeExpressionParens(`Random from ${min} to ${max}`, depth);
    }
    case '+':
    case '*':
    case '-':
    case '/':
    case '%':
    case '^': {
      let lhs = makeExpressionSummary(expression.params.lhs, context, depth + 1),
        rhs = makeExpressionSummary(expression.params.rhs, context, depth + 1);
      return maybeExpressionParens(`${lhs} ${expression.expressionType} ${rhs}`, depth);
    }
    case 'abs':
    case 'floor':
    case 'sin':
    case 'rad': {
      let number = makeExpressionSummary(expression.params.number, context, depth + 1);
      return `${expression.expressionType}(${number})`;
    }
    case 'time': {
      return '⏰';
    }
    case 'log': {
      let base = makeExpressionSummary(expression.params.base, context, depth + 1),
        number = makeExpressionSummary(expression.params.number, context, depth + 1);
      return maybeExpressionParens(`Log base ${base} of ${number}`, depth);
    }
    case 'number of actors': {
      if (expression.params.tag) {
        return `The number of actors tagged ${formatTag(expression.params.tag)}`;
      } else {
        return `The total number of actors`;
      }
    }
    case 'min':
    case 'max':
    case 'choose':
    case 'weighted choose': {
      let lhs = makeExpressionSummary(expression.params.lhs, context, depth + 1),
        rhs = makeExpressionSummary(expression.params.rhs, context, depth + 1);
      return `${expression.expressionType}(${lhs}, ${rhs})`;
    }
    case 'mix': {
      let lhs = makeExpressionSummary(expression.params.lhs, context, depth + 1),
        rhs = makeExpressionSummary(expression.params.rhs, context, depth + 1),
        mix = makeExpressionSummary(expression.params.mix, context, depth + 1);
      return maybeExpressionParens(`${lhs} and ${rhs} mixed by ${mix}`);
    }
    case 'clamp': {
      let number = makeExpressionSummary(expression.params.number, context, depth + 1),
        min = makeExpressionSummary(expression.params.min, context, depth + 1),
        max = makeExpressionSummary(expression.params.max, context, depth + 1);
      return maybeExpressionParens(`${number} clamped between ${min} and ${max}`);
    }
    case 'perlin': {
      let x = makeExpressionSummary(expression.params.x, context, depth + 1),
        y = makeExpressionSummary(expression.params.y, context, depth + 1);
      return `${expression.expressionType}(${x}, ${y})`;
    }
    case 'gauss': {
      let mean = makeExpressionSummary(expression.params.mean, context, depth + 1),
        sigma = makeExpressionSummary(expression.params.sigma, context, depth + 1);
      return `${expression.expressionType}(${mean}, ${sigma})`;
    }
    case 'variable': {
      let variableLabel;
      if (context?.variables) {
        const variable = context.variables.find((v) => v.id === expression.params.variableId);
        if (variable) {
          variableLabel = variable.name;
        }
      }
      if (!variableLabel) {
        variableLabel = expression.params.variableId;
      }
      return formatVariableName(variableLabel);
    }
    case 'counter value': {
      const actorRef = makeActorRefSummary(expression.params.actorRef);
      return `${actorRef}: Counter: Value`;
    }
    case 'behavior property': {
      const { behaviors } = context;
      let selectedBehavior, selectedProperty;
      if (expression.params?.behaviorId) {
        const entry = Object.entries(context.behaviors).find(
          ([_, b]) => b.behaviorId === expression.params.behaviorId
        );
        if (entry) {
          selectedBehavior = entry[1];
        }
      }
      if (selectedBehavior && expression.params?.propertyName) {
        selectedProperty = selectedBehavior.propertySpecs[expression.params.propertyName];
      }
      if (selectedBehavior && selectedProperty) {
        const actorRef = makeActorRefSummary(expression.params.actorRef);
        return `${actorRef}: ${selectedBehavior.displayName}: ${selectedProperty.label}`;
      }
    }
    case 'actor distance': {
      const fromActor = makeActorRefSummary(expression.params.fromActor),
        toActor = makeActorRefSummary(expression.params.toActor);
      return maybeExpressionParens(
        `The distance from ${fromActor} position to ${toActor} position`
      );
    }
    case 'actor angle':
      const fromActor = makeActorRefSummary(expression.params.fromActor),
        toActor = makeActorRefSummary(expression.params.toActor);
      return maybeExpressionParens(`The angle from ${fromActor} position to ${toActor} position`);
  }
  return null;
};
