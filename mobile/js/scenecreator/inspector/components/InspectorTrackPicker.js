import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PopoverButton } from '../../../components/PopoverProvider';
import { DropdownItemsList } from './InspectorDropdown';
import { makeTrackName } from '../../SceneCreatorUtilities';
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

export const InspectorTrackPicker = ({ value, onChange, style, ...props }) => {
  const musicComponent = useCoreState('EDITOR_SELECTED_COMPONENT:Music') || {
    props: {
      song: {
        tracks: [],
      },
    },
  };
  const tracks = musicComponent.props.song.tracks;
  let items;
  if (tracks) {
    items = tracks.map((track, ii) => ({
      index: ii,
      name: makeTrackName(track),
    }));
  } else {
    items = [];
  }

  let selectedItem;
  if (value !== undefined && value >= 0) {
    selectedItem = items[value];
  }

  const popover = {
    Component: DropdownItemsList,
    items,
    selectedItem,
    height: 192,
    onSelectItem: (item) => onChange(item.index),
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
