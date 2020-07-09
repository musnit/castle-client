// Whether a pane should be rendered
export const paneVisible = (element) => element && element.children && element.children.count > 0;

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
