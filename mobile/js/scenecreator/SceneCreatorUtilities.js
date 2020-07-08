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
