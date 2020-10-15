import React from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '../ReactNavigation';

import Icon from 'react-native-vector-icons/MaterialIcons';

import * as Constants from '../Constants';

const styles = StyleSheet.create({
  back: {
    flexShrink: 0,
    width: 60,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingLeft: 12,
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 54,
    borderBottomWidth: 1,
    borderColor: Constants.colors.grayOnBlackBorder,
    paddingTop: 16,
  },
  title: {
    width: '100%',
    height: '100%',
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTitle: {
    zIndex: -1, // required to prevent negative margin from blocking back button
    marginLeft: -54, // required to center properly with back button
  },
  titleText: {
    color: Constants.colors.white,
    fontSize: 20,
    marginVertical: 16,
  },
});

export const ScreenHeader = ({ title }) => {
  const { pop, dangerouslyGetState } = useNavigation();

  // don't useNavigationState() because we don't want to rerender if this changes.
  const navigationStackIndex = dangerouslyGetState().index;
  const showBackButton = navigationStackIndex > 0;

  return (
    <React.Fragment>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        {showBackButton ? (
          <TouchableOpacity style={styles.back} onPress={() => pop()}>
            <Icon name="arrow-back" size={32} color="#fff" />
          </TouchableOpacity>
        ) : null}
        <View style={[styles.title, showBackButton ? styles.centerTitle : null]}>
          <Text style={styles.titleText}>{title}</Text>
        </View>
      </View>
    </React.Fragment>
  );
};
