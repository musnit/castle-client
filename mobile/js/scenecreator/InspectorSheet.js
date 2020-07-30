import React, { useEffect, useState } from 'react';
import { useCardCreator } from './CreateCardContext';
import { useGhostUI } from '../ghost/GhostUI';
import { InspectorHeader } from './inspector/InspectorHeader';
import { InspectorTabs } from './inspector/InspectorTabs';

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

export default InspectorSheet = ({ isOpen, addChildSheet }) => {
  const { root } = useGhostUI();
  if (!root || !root.panes) return null;

  const actionsPane = root.panes.sceneCreatorInspectorActions;
  const { isTextActorSelected } = useCardCreator();

  const [selectedTab, setSelectedTab] = React.useState(TAB_ITEMS[0].value);

  useEffect(() => {
    // reset selected tab
    setSelectedTab(TAB_ITEMS[0].value);
  }, [isTextActorSelected]);

  const tabItems = TAB_ITEMS.filter((tab) => {
    // hide 'Movement' for text actors
    return !(isTextActorSelected && tab.value === 'movement');
  });

  const renderHeader = () => (
    <InspectorHeader
      isOpen={isOpen}
      isTextActorSelected={isTextActorSelected}
      tabItems={tabItems}
      selectedTab={selectedTab}
      setSelectedTab={setSelectedTab}
      pane={actionsPane}
    />
  );

  const renderContent = () => (
    <InspectorTabs addChildSheet={addChildSheet} selectedTab={selectedTab} />
  );

  return (
    <CardCreatorBottomSheet
      isOpen={isOpen}
      headerHeight={88}
      renderHeader={renderHeader}
      renderContent={renderContent}
      persistLastSnapWhenOpened
    />
  );
};
