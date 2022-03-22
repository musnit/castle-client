import { ResourceSavingView } from '@react-navigation/elements';
import * as React from 'react';
import { StyleProp, View, ViewProps, ViewStyle } from 'react-native';

let Screens;

try {
  Screens = require('react-native-screens');
} catch (e) {
  // Ignore
}

export const MaybeScreenContainer = ({ enabled, ...rest }) => {
  if (Screens?.screensEnabled?.()) {
    return <Screens.ScreenContainer enabled={enabled} {...rest} />;
  }

  return <View {...rest} />;
};

export function MaybeScreen({ visible, children, ...rest }) {
  if (Screens?.screensEnabled?.()) {
    return (
      <Screens.Screen activityState={visible ? 2 : 0} {...rest}>
        {children}
      </Screens.Screen>
    );
  }

  return (
    <ResourceSavingView visible={visible} {...rest}>
      {children}
    </ResourceSavingView>
  );
}
