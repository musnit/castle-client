import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { InspectorNumberInput } from '../components/InspectorNumberInput';

import * as Constants from '../../../Constants';
import * as SceneCreatorConstants from '../../SceneCreatorConstants';

import Entypo from 'react-native-vector-icons/Entypo';
import Feather from 'react-native-vector-icons/Feather';

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    flexDirection: 'row',
    borderRadius: 6,
  },
  playButtonContainer: {
    paddingRight: 12,
    width: 72,
    flexShrink: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    borderWidth: 1,
    borderBottomWidth: 2,
    borderColor: Constants.colors.black,
    width: '100%',
    aspectRatio: 1,
    borderRadius: 128,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controls: {
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
    padding: 3,
    borderColor: Constants.colors.black,
    fontSize: 15,
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

export const PlaySoundResponse = ({
  response,
  onChangeResponse,
  children,
  sendRuleAction,
  ...props
}) => {
  const [lastNativeUpdate, incrementLastNativeUpdate] = React.useReducer((state) => state + 1, 0);
  React.useEffect(incrementLastNativeUpdate, [response.params]);

  const onChangeSound = React.useCallback(
    (response) => {
      onChangeResponse(response);
      sendRuleAction('changeSound', response.params);
    },
    [onChangeResponse, sendRuleAction]
  );

  const onChangeCategory = (index) =>
    onChangeSound({
      ...response,
      params: {
        ...response.params,
        category: SOUND_CATEGORIES[index].name,
      },
    });
  const onChangeSeed = (seed) =>
    onChangeSound({
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
        <View style={styles.playButtonContainer}>
          <TouchableOpacity
            style={styles.playButton}
            onPress={() => sendRuleAction('changeSound', response.params)}>
            <Entypo
              name="controller-play"
              size={36}
              color="#000"
              style={{ marginLeft: 6, marginTop: 3 }}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.controls}>
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
            <View style={{ width: '30%', marginLeft: 8 }}>
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
      </View>
    </React.Fragment>
  );
};
