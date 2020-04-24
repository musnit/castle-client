// Whether a pane should be rendered
export const paneVisible = (element) =>
  element &&
  element.props &&
  element.props.visible &&
  element.children &&
  element.children.count > 0;
