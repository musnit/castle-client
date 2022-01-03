import React, { useEffect, useState } from 'react';
import { useCardCreator } from '../CreateCardContext';
import { CardCreatorBottomSheet } from '../sheets/CardCreatorBottomSheet';
import { InspectorHeader } from './InspectorHeader';
import { InspectorTabs } from './InspectorTabs';
import { sendAsync } from '../../core/CoreEvents';

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
  const { isSceneLoaded, isTextActorSelected } = useCardCreator();

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

  const onSnap = React.useCallback((i) => {
    if (Constants.Android) {
      sendAsync('SCENE_CREATOR_INSPECTOR_SHEET_MAXIMIZED', {
        isMaximized: i == 2,
      });
    }
  }, []);

  useEffect(() => {
    // reset selected tab
    setSelectedTab(TAB_ITEMS[0].value);
  }, [isTextActorSelected]);

  if (isSceneLoaded) {
    const renderHeader = () => (
      <InspectorHeader
        isOpen={isOpen}
        tabItems={TAB_ITEMS}
        selectedTab={selectedTab}
        setSelectedTab={setSelectedTabOrScroll}
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
        extraTopInset={8}
        onSnap={onSnap}
      />
    );
  }
  return null;
};
