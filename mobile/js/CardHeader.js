import React, { Fragment } from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import * as Constants from './Constants';

import ConfigureInput from './ConfigureInput';

const styles = StyleSheet.create({
  container: {
    zIndex: 1, // we use negative margin to place the scene behind the header
    height: 54,
  },
  back: {
    flexShrink: 0,
    width: 54,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingTop: 6,
  },
  titleContainer: {
    width: '100%',
    flexShrink: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const CardHeader = (props) => {
  const { card, isEditable, onPressBack } = props;
  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />
      <TouchableOpacity style={styles.back} onPress={onPressBack}>
        <Icon name="close" size={32} color="#fff" style={Constants.styles.textShadow} />
      </TouchableOpacity>
      {/* <TouchableOpacity style={styles.titleContainer} onPress={() => {}}>
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
          Drawer
        </Text>
      </TouchableOpacity> */}
    </View>
  );
};

export default CardHeader;
