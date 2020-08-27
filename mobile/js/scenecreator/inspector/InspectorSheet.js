import React, { useEffect, useState } from 'react';
import { useCardCreator } from '../CreateCardContext';
import { useGhostUI } from '../../ghost/GhostUI';
import { CardCreatorBottomSheet } from '../sheets/CardCreatorBottomSheet';
import { InspectorHeader } from './InspectorHeader';
import { InspectorTabs } from './InspectorTabs';

import * as Constants from '../../Constants';

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

export const InspectorSheet = ({ isOpen, addChildSheet }) => {
  const { root } = useGhostUI();
  const { isTextActorSelected } = useCardCreator();

  const [selectedTab, setSelectedTab] = React.useState(TAB_ITEMS[0].value);
  const scrollViewRef = React.useRef(null);

  const setSelectedTabOrScroll = React.useCallback(
    (value) => {
      if (value === selectedTab) {
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollToPosition(0, 0);
        }
      } else {
        setSelectedTab(value);
      }
    },
    [scrollViewRef.current, selectedTab]
  );

  useEffect(() => {
    // reset selected tab
    setSelectedTab(TAB_ITEMS[0].value);
  }, [isTextActorSelected]);

  if (root?.panes) {
    const actionsPane = root.panes.sceneCreatorInspectorActions;

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
        setSelectedTab={setSelectedTabOrScroll}
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
        contentKey={`tab-${selectedTab}`}
        renderHeader={renderHeader}
        renderContent={renderContent}
        scrollViewRef={scrollViewRef}
        persistLastSnapWhenOpened
      />
    );
  }
  return null;
};
