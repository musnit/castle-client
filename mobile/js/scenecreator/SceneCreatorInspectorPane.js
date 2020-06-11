import React, { useEffect, useState } from 'react';
import { useGhostUI } from '../ghost/GhostUI';
import { SceneCreatorInspectorActions } from './SceneCreatorInspectorActions';
import { SceneCreatorInspector } from './SceneCreatorInspector';

import * as Constants from '../Constants';

import SceneCreatorPane from './SceneCreatorPane';

const TAB_ITEMS = [
  {
    name: 'General',
    value: 'general',
  },
  {
    name: 'Movement',
    value: 'movement',
  },
  {
    name: 'Rules',
    value: 'rules',
  },
];

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

  const [selectedTab, setSelectedTab] = React.useState(TAB_ITEMS[0].value);
  const tabItems = TAB_ITEMS.filter((tab) => {
    // hide 'Movement' for text actors
    return !(isTextActorSelected && tab === 'movement');
  });

  const renderHeader = () => (
    <SceneCreatorInspectorActions
      visible={visible}
      isTextActorSelected={isTextActorSelected}
      tabItems={tabItems}
      selectedTab={selectedTab}
      setSelectedTab={setSelectedTab}
      pane={visible ? actionsPane : lastVisibleElements.actionsPane}
    />
  );

  const renderContent = () => (
    <SceneCreatorInspector
      selectedTab={selectedTab}
      isTextActorSelected={isTextActorSelected}
      element={
        visible
          ? element
          : {
              ...lastVisibleElements.element,
              props: { ...lastVisibleElements.element.props },
            }
      }
    />
  );

  return (
    <SceneCreatorPane
      visible={visible}
      context={context}
      renderHeader={renderHeader}
      renderContent={renderContent}
      persistLastSnapWhenOpened
    />
  );
};
