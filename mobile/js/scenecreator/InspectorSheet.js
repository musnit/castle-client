import React, { useEffect, useState } from 'react';
import { useGhostUI } from '../ghost/GhostUI';
import { InspectorHeader } from './InspectorHeader';
import { InspectorTabs } from './InspectorTabs';

import * as Constants from '../Constants';

import CardCreatorBottomSheet from './CardCreatorBottomSheet';

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

export default InspectorSheet = ({ element, isOpen, context }) => {
  const { root } = useGhostUI();
  const actionsPane = root.panes.sceneCreatorInspectorActions;
  const { isTextActorSelected } = context;

  // Do this so we can show last visible elements while animating out
  const [lastVisibleElements, setLastVisibleElements] = useState({ element, actionsPane });
  useEffect(() => {
    if (isOpen) {
      setLastVisibleElements({ element, actionsPane });
    }
  }, [isOpen, element, actionsPane]);

  const [selectedTab, setSelectedTab] = React.useState(TAB_ITEMS[0].value);
  const tabItems = TAB_ITEMS.filter((tab) => {
    // hide 'Movement' for text actors
    return !(isTextActorSelected && tab === 'movement');
  });

  const renderHeader = () => (
    <InspectorHeader
      isOpen={isOpen}
      isTextActorSelected={isTextActorSelected}
      tabItems={tabItems}
      selectedTab={selectedTab}
      setSelectedTab={setSelectedTab}
      pane={isOpen ? actionsPane : lastVisibleElements.actionsPane}
    />
  );

  const renderContent = () => (
    <InspectorTabs
      selectedTab={selectedTab}
      isTextActorSelected={isTextActorSelected}
      element={
        isOpen
          ? element
          : {
              ...lastVisibleElements.element,
              props: { ...lastVisibleElements.element.props },
            }
      }
    />
  );

  return (
    <CardCreatorBottomSheet
      isOpen={isOpen}
      context={context}
      renderHeader={renderHeader}
      renderContent={renderContent}
      persistLastSnapWhenOpened
    />
  );
};
