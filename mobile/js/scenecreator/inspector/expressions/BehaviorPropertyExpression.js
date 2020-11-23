import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { InspectorActorRefInput } from '../components/InspectorActorRefInput';

import * as Constants from '../../../Constants';
import * as SceneCreatorConstants from '../../SceneCreatorConstants';

const styles = StyleSheet.create({
  behaviorInputRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingBottom: 4,
    alignItems: 'center',
  },
  paramLabel: {
    fontSize: 14,
  },
  cell: {
    marginRight: 8,
    marginTop: 8,
  },
  placeholder: {
    borderColor: '#aaa',
    borderBottomWidth: 1,
  },
  placeholderText: {
    fontSize: 16,
    color: Constants.colors.grayText,
    fontWeight: 'normal',
  },
});

export const BehaviorPropertyExpression = ({
  value,
  onChange,
  showBehaviorPropertyPicker,
  context,
}) => {
  const { behaviors } = context;
  let selectedBehavior;
  if (value.params?.behaviorId) {
    const entry = Object.entries(context.behaviors).find(
      ([_, b]) => b.behaviorId === value.params.behaviorId
    );
    if (entry) {
      selectedBehavior = entry[1];
    }
  }

  const onChooseBehavior = () =>
    showBehaviorPropertyPicker({
      onSelectBehaviorProperty: (behaviorId, propertyName) =>
        onChange({
          ...value,
          params: {
            ...value.params,
            behaviorId,
            propertyName,
          },
        }),
      useAllBehaviors: value.params?.actorType !== 'self',
    });

  const setActorRef = (actorRef) =>
    onChange({
      ...value,
      params: {
        ...value.params,
        actorRef,
      },
    });

  return (
    <View>
      <View style={styles.behaviorInputRow}>
        {selectedBehavior && value.params?.propertyName ? (
          <React.Fragment>
            <TouchableOpacity
              style={[SceneCreatorConstants.styles.button, styles.cell]}
              onPress={onChooseBehavior}>
              <Text style={[SceneCreatorConstants.styles.buttonLabel, { fontWeight: 'normal' }]}>
                {selectedBehavior.displayName}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[SceneCreatorConstants.styles.button, styles.cell]}
              onPress={onChooseBehavior}>
              <Text style={[SceneCreatorConstants.styles.buttonLabel, { fontWeight: 'normal' }]}>
                {selectedBehavior.propertySpecs[value.params.propertyName].label}
              </Text>
            </TouchableOpacity>
          </React.Fragment>
        ) : (
          <TouchableOpacity
            style={[SceneCreatorConstants.styles.button, styles.placeholder]}
            onPress={onChooseBehavior}>
            <Text style={[SceneCreatorConstants.styles.buttonLabel, styles.placeholderText]}>
              Choose behavior
            </Text>
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.paramLabel}>Property</Text>
      <View style={[styles.behaviorInputRow, { marginTop: 12 }]}>
        <InspectorActorRefInput
          value={value.params?.actorRef}
          onChange={setActorRef}
          context={context}
        />
      </View>
      <Text style={styles.paramLabel}>Actor</Text>
    </View>
  );
};
