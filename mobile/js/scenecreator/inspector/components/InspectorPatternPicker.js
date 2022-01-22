import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PopoverButton } from '../../../components/PopoverProvider';
import { DropdownItemsList } from './InspectorDropdown';
import { makeDefaultPatternName } from '../../SceneCreatorUtilities';
import { useCoreState } from '../../../core/CoreEvents';

import * as Constants from '../../../Constants';
import * as SceneCreatorConstants from '../../SceneCreatorConstants';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  box: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 4,
    padding: 8,
    paddingVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    ...Constants.styles.dropShadow,
  },
  activeBox: {
    borderBottomWidth: 1,
    marginBottom: 1,
    borderStyle: 'dashed',
  },
  label: {
    fontSize: 16,
  },
});

export const InspectorPatternPicker = ({ value, onChange, style, ...props }) => {
  const musicComponent = useCoreState('EDITOR_SELECTED_COMPONENT:Music') || {
    props: {
      song: {
        patterns: {},
      },
    },
  };
  const patterns = musicComponent.props.song.patterns;
  let items;
  if (patterns) {
    items = Object.keys(patterns).map((patternId) => ({
      patternId,
      name: makeDefaultPatternName(patterns[patternId]),
    }));
  } else {
    items = [];
  }

  let selectedItem;
  if (value && value !== 'none') {
    selectedItem = items.find((item) => item.patternId === value);
  }

  const popover = {
    Component: DropdownItemsList,
    items,
    selectedItem,
    height: 192,
    onSelectItem: (item) => onChange(item.patternId),
  };

  let valueLabel = selectedItem ? selectedItem.name : '(none)';

  return (
    <View style={[styles.container, style]} {...props}>
      <PopoverButton
        style={styles.box}
        activeStyle={[styles.box, styles.activeBox]}
        popover={popover}>
        <Text>{valueLabel}</Text>
      </PopoverButton>
    </View>
  );
};
