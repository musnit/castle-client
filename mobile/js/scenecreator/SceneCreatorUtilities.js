import { getPaneData, sendDataPaneAction } from '../ghost/GhostUI';

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

export const makeExpressionSummary = (expression, context) => {
  if (!expression?.expressionType) {
    return expression;
  }
  switch (expression.expressionType) {
    case 'number':
      return expression.params.value;
    case 'random': {
      let min = makeExpressionSummary(expression.params.min, context),
        max = makeExpressionSummary(expression.params.max, context);
      return `Random from ${min} to ${max}`;
    }
    case 'variable': {
      let variableLabel;
      if (context?.variables) {
        variableLabel = context.variables.find((v) => v.id === expression.params.variableId).name;
      }
      if (!variableLabel) {
        variableLabel = expression.params.variableId;
      }
      return `\$${variableLabel}`;
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
        return `${selectedBehavior.displayName}: ${selectedProperty.label}`;
      }
    }
  }
  return null;
};
