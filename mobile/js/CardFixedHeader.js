import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeArea } from 'react-native-safe-area-context';

import * as Constants from './Constants';
import * as Utilities from './utilities';

const styles = StyleSheet.create({
  fixedHeader: {
    width: '100%',
    height: 54,
    position: 'absolute',
    top: 0,
    height: 54,
    flexDirection: 'row',
    zIndex: 1,
    elevation: 1,
  },
  back: {
    flexShrink: 0,
    width: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    width: '100%',
    flexShrink: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -54, // required to center properly with back button
    zIndex: -1, // required to prevent negative margin from blocking back button
  },
  name: {
    color: '#fff',
  },
});

const CardFixedHeader = ({ card, expanded, isEditable, onPressBack, onPressTitle }) => {
  const title = Utilities.makeCardPreviewTitle(card);
  const insets = useSafeArea();
  return (
    <View style={[styles.fixedHeader, { top: insets.top }]}>
      <TouchableOpacity style={styles.back} onPress={onPressBack}>
        <Icon name="close" size={32} color="#fff" style={Constants.styles.textShadow} />
      </TouchableOpacity>
      {isEditable && (
        <TouchableOpacity style={styles.titleContainer} onPress={onPressTitle}>
          <Text style={[styles.name, { backgroundColor: expanded ? 'transparent' : '#0006' }]}>
            {title}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default CardFixedHeader;
