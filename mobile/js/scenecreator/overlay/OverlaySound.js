import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useCoreState, sendGlobalAction, sendAsync } from '../../core/CoreEvents';

import * as Constants from '../../Constants';
const { CastleIcon } = Constants;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  leftContainer: {
    width: 36,
  },
  rightContainer: {
    width: 36,
  },
  close: {
    borderRadius: 6,
    backgroundColor: Constants.colors.white,
    borderColor: Constants.colors.black,
    borderWidth: 1,
    ...Constants.styles.dropShadow,
    marginBottom: 8,
  },
  toolbar: {
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: Constants.colors.white,
    borderColor: Constants.colors.black,
    borderWidth: 1,
    flexDirection: 'column',
    alignItems: 'center',
    ...Constants.styles.dropShadow,
    marginBottom: 8,
  },
  button: {
    width: 36,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export const OverlaySound = ({ setActiveSheet }) => {
  // const drawToolState = useCoreState('EDITOR_DRAW_TOOL') || {};

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.leftContainer}>
        <View style={[styles.close, styles.button]}>
          <Pressable onPress={() => sendGlobalAction('setMode', 'default')}>
            <CastleIcon name="close" size={22} color="#000" />
          </Pressable>
        </View>
      </View>
    </View>
  );
};
