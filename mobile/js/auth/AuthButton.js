import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AppText as Text } from '../components/AppText';

import * as Constants from '../Constants';

const styles = StyleSheet.create({
  spinner: {
    backgroundColor: '#fff',
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
  },
});

export const AuthButton = (props) => {
  return (
    <View
      style={{
        ...Constants.styles.primaryButton,
        ...Constants.styles.buttonLarge,
        marginVertical: 24,
        // for some reason the button could render with zero height on Android, even though the
        // inner Text has intrinsic height, so force a minimum height on the overall button
        minHeight: 48,
      }}>
      <Text style={[Constants.styles.primaryButtonLabel, Constants.styles.buttonLargeLabel]}>
        {props.text}
      </Text>
      {props.spinner ? (
        <View style={styles.spinner}>
          <ActivityIndicator size="small" color="#000" />
        </View>
      ) : null}
    </View>
  );
};
