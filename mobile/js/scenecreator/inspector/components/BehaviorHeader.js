import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, Switch, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import * as SceneCreatorConstants from '../../SceneCreatorConstants';

const styles = StyleSheet.create({
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switch: {
    marginRight: 12,
  },
});

export const BehaviorHeader = ({ name, behavior, sendAction }) => {
  if (!behavior) return null;
  name = name ?? behavior.displayName;
  const onRemove = () => sendAction('remove');

  let disableBehaviorSwitch;
  if (behavior.allowsDisableWithoutRemoval) {
    const onChangeSwitch = (value) => sendAction(value ? 'enable' : 'disable');
    disableBehaviorSwitch = (
      <Switch
        style={styles.switch}
        value={!behavior.isDisabled}
        onValueChange={onChangeSwitch}
        trackColor={{ true: '#000' }}
      />
    );
  }

  return (
    <View style={SceneCreatorConstants.styles.behaviorHeader}>
      <View style={styles.left}>
        {disableBehaviorSwitch}
        <Text style={SceneCreatorConstants.styles.behaviorHeaderName}>{name}</Text>
      </View>
      {onRemove ? (
        <TouchableOpacity
          onPress={onRemove}
          style={SceneCreatorConstants.styles.behaviorHeaderRemoveButton}>
          <Icon name="delete" size={22} color="#000" />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};
