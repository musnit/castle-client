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
