import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { InspectorNumberInput } from '../components/InspectorNumberInput';

import * as Constants from '../../../Constants';
import * as SceneCreatorConstants from '../../SceneCreatorConstants';

import Feather from 'react-native-vector-icons/Feather';

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    alignItems: 'flex-start',
  },
  soundInputsRow: {
    flexDirection: 'row',
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 4,
    borderColor: Constants.colors.black,
    borderWidth: 1,
    borderBottomWidth: 2,
    marginBottom: 8,
  },
  segmentedControlItem: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    borderColor: Constants.colors.black,
    fontSize: 16,
  },
  segmentedControlItemSelected: {
    backgroundColor: Constants.colors.black,
  },
  segmentedControlLabelSelected: {
    color: Constants.colors.white,
    fontWeight: 'bold',
  },
});

const SOUND_CATEGORIES = [
  {
    name: 'pickup',
    icon: 'anchor',
  },
  {
    name: 'laser',
    icon: 'activity',
  },
  {
    name: 'explosion',
    icon: 'loader',
  },
  {
    name: 'powerup',
    icon: 'flag',
  },
  {
    name: 'hit',
    icon: 'shield',
  },
  {
    name: 'jump',
    icon: 'coffee',
  },
  {
    name: 'blip',
    icon: 'key',
  },
  {
    name: 'random',
    icon: 'help-circle',
  },
];

export const PlaySoundResponse = ({ response, onChangeResponse, children, ...props }) => {
  const [lastNativeUpdate, incrementLastNativeUpdate] = React.useReducer((state) => state + 1, 0);
  React.useEffect(incrementLastNativeUpdate, [response.params]);
  const onChangeCategory = (index) =>
    onChangeResponse({
      ...response,
      params: {
        ...response.params,
        category: SOUND_CATEGORIES[index].name,
      },
    });
  const onChangeSeed = (seed) =>
    onChangeResponse({
      ...response,
      params: {
        ...response.params,
        seed,
      },
    });
  const selectedCategoryIndex = response.params?.category
    ? SOUND_CATEGORIES.findIndex((c) => c.name === response.params.category)
    : 0;
  return (
    <React.Fragment>
      {children}
      <View style={[SceneCreatorConstants.styles.button, styles.container]}>
        <View style={styles.segmentedControl}>
          {SOUND_CATEGORIES.map((category, ii) => (
            <TouchableOpacity
              key={`item-${ii}`}
              onPress={() => onChangeCategory(ii)}
              style={[
                styles.segmentedControlItem,
                ii === selectedCategoryIndex ? styles.segmentedControlItemSelected : null,
                ii > 0 ? { borderLeftWidth: 1 } : null,
              ]}>
              <Feather
                name={category.icon}
                size={12}
                style={[
                  styles.segmentedControlItem,
                  ii === selectedCategoryIndex ? styles.segmentedControlLabelSelected : null,
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.soundInputsRow}>
          <TouchableOpacity
            style={SceneCreatorConstants.styles.button}
            onPress={() => onChangeSeed(Math.floor(Math.random() * Math.floor(9999)))}>
            <Text style={SceneCreatorConstants.styles.buttonLabel}>New</Text>
          </TouchableOpacity>
          <View style={{ width: '25%', marginLeft: 8 }}>
            <InspectorNumberInput
              hideIncrements
              lastNativeUpdate={lastNativeUpdate}
              placeholder="Seed"
              value={response.params?.seed}
              onChange={onChangeSeed}
            />
          </View>
        </View>
      </View>
    </React.Fragment>
  );
};
