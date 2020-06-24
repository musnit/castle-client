import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import * as SceneCreatorConstants from '../../SceneCreatorConstants';

export const BehaviorHeader = ({ name, onRemove }) => {
  return (
    <View style={SceneCreatorConstants.styles.behaviorHeader}>
      <Text style={SceneCreatorConstants.styles.behaviorHeaderName}>{name}</Text>
      {onRemove ? (
        <TouchableOpacity onPress={onRemove} style={SceneCreatorConstants.styles.behaviorHeaderRemoveButton}>
          <Icon name="delete" size={22} color="#000" />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};
