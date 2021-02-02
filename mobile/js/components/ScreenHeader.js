import React from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '../ReactNavigation';

import Icon from 'react-native-vector-icons/MaterialIcons';

import * as Constants from '../Constants';

const styles = StyleSheet.create({
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
  button: {
    flexShrink: 0,
    width: 60,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  buttonLeft: {
    alignItems: 'flex-start',
    paddingLeft: 12,
  },
  buttonRight: {
    alignItems: 'flex-end',
    paddingRight: 12,
  },
  title: {
    width: '100%',
    height: '100%',
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    color: Constants.colors.white,
    fontSize: 20,
    marginVertical: 16,
  },
});

export const ScreenHeader = ({ title, rightIcon, onRightButtonPress }) => {
  const { pop, dangerouslyGetState } = useNavigation();

  // don't useNavigationState() because we don't want to rerender if this changes.
  const navigationStackIndex = dangerouslyGetState().index;
  const showBackButton = navigationStackIndex > 0;

  return (
    <React.Fragment>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        {showBackButton ? (
          <TouchableOpacity style={[styles.button, styles.buttonLeft]} onPress={() => pop()}>
            <Icon name="arrow-back" size={32} color="#fff" />
          </TouchableOpacity>
        ) : (
          <View style={[styles.button, styles.buttonLeft]} />
        )}
        <View style={[styles.title, showBackButton ? styles.centerTitle : null]}>
          <Text style={styles.titleText}>{title}</Text>
        </View>
        {rightIcon ? (
          <TouchableOpacity
            style={[styles.button, styles.buttonRight]}
            onPress={onRightButtonPress}>
            <Icon name={rightIcon} size={24} color="#fff" />
          </TouchableOpacity>
        ) : (
          <View style={[styles.button, styles.buttonRight]} />
        )}
      </View>
    </React.Fragment>
  );
};
