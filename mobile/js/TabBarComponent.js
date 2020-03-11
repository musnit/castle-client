import React from 'react';
import { View } from 'react-native';
import { BottomTabBar } from '@react-navigation/bottom-tabs';

let tabBarLayout = {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
};

export function getTabBarHeight() {
  console.log(`ben gettab bar height: ${tabBarLayout.height}`);
  return tabBarLayout.height;
}

export const TabBarComponent = (props) => (
  <BottomTabBar
    onLayout={(event) => {
      tabBarLayout = event.nativeEvent.layout;
    }}
    {...props}
  />
);
