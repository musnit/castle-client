import React, { useEffect, useState } from 'react';
import { useGhostUI } from '../ghost/GhostUI';
import { SceneCreatorInspectorActions } from './SceneCreatorInspectorActions';

import * as Constants from '../Constants';

import SceneCreatorPane from './SceneCreatorPane';

export default SceneCreatorInspectorPane = ({ element, visible, isTextActorSelected, context }) => {
  const { root } = useGhostUI();
  const actionsPane = root.panes.sceneCreatorInspectorActions;

  // Do this so we can show last visible elements while animating out
  const [lastVisibleElements, setLastVisibleElements] = useState({ element, actionsPane });
  useEffect(() => {
    if (visible) {
      setLastVisibleElements({ element, actionsPane });
    }
  }, [visible, element, actionsPane]);

  const renderHeader = () => (
    <SceneCreatorInspectorActions
      visible={visible}
      isTextActorSelected={isTextActorSelected}
      pane={visible ? actionsPane : lastVisibleElements.actionsPane}
    />
  );

  return (
    <SceneCreatorPane
      visible={visible}
      element={
        visible
          ? element
          : {
              ...lastVisibleElements.element,
              props: { ...lastVisibleElements.element.props },
            }
      }
      context={context}
      renderHeader={renderHeader}
      persistLastSnapWhenOpened
    />
  );
};
