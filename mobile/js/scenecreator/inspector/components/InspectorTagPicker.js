import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DropdownItemsList } from '../components/InspectorDropdown';
import { PopoverButton } from '../../PopoverProvider';

import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Feather from 'react-native-vector-icons/Feather';

const styles = StyleSheet.create({
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagCell: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    borderRadius: 3,
    borderWidth: 1,
    borderBottomWidth: 2,
    borderColor: '#000',
    marginRight: 8,
    marginBottom: 8,
  },
  tagCellLabel: {
    paddingLeft: 4,
    fontSize: 16,
    fontWeight: 'bold',
  },
  addTagCell: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#888',
    borderRadius: 4,
    padding: 8,
    paddingVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginRight: 8,
    marginBottom: 8,
  },
  addTagCellLabel: {
    fontSize: 16,
    color: '#888',
  },
  activeCell: {
    borderBottomWidth: 1,
    marginBottom: 9,
    borderStyle: 'dashed',
  },
  removeButton: {
    flexDirection: 'row',
    padding: 8,
    alignItems: 'center',
  },
  removeLabel: {
    marginLeft: 8,
    fontSize: 16,
  },
});

const RemoveTagButton = ({ tag, onPress, closePopover }) => (
  <TouchableOpacity
    style={styles.removeButton}
    onPress={() => {
      onPress(tag);
      closePopover();
    }}>
    <Feather name="trash-2" size={20} color="#000" />
    <Text style={styles.removeLabel}>
      Remove <Text style={{ fontWeight: 'bold' }}>{tag}</Text>
    </Text>
  </TouchableOpacity>
);

/**
 *  @prop value string of tags separated by spaces
 */
export const InspectorTagPicker = ({ value, onChange, context, ...props }) => {
  const { tagToActorIds } = context;
  const [components, setComponents] = React.useState([]);
  const [tagsToAdd, setTagsToAdd] = React.useState();

  React.useEffect(() => {
    if (value) {
      setComponents(
        value
          .split(' ')
          .filter((component) => component.length)
          .sort((a, b) => a.localeCompare(b))
          .map((component) => component.toLowerCase())
      );
    } else {
      setComponents([]);
    }
  }, [value]);

  React.useEffect(() => {
    if (tagToActorIds) {
      setTagsToAdd(
        Object.keys(tagToActorIds)
          .filter((tag) => !components || !components.includes(tag))
          .map((tag) => ({ id: tag, name: tag }))
      );
    }
  }, [tagToActorIds, components]);

  const selectTag = React.useCallback(
    (item) => {
      if (props?.singleSelect) {
        onChange(item.id);
      } else {
        onChange(value ? `${value} ${item.id}` : item.id);
      }
    },
    [value, onChange, props?.singleSelect]
  );

  const addTag = React.useCallback(
    (item) => {
      if (item) {
        if (props?.singleSelect) {
          item = item.replace(/\s/g, '');
          if (item.length) {
            onChange(item);
          }
        } else {
          item = item
            .split(' ')
            .filter((c) => c.length && (!components || !components.includes(c)))
            .join(' ');
          if (item?.length) {
            onChange(value?.length ? `${value} ${item}` : item);
          }
        }
      }
    },
    [value, components, onChange, props?.singleSelect]
  );

  const addTagPopover = {
    Component: DropdownItemsList,
    items: tagsToAdd,
    height: 192,
    showAddItem: true,
    onSelectItem: selectTag,
    onAddItem: addTag,
  };

  const removeTagPopover = {
    Component: RemoveTagButton,
    height: 64,
    onPress: (tag) => onChange(components.filter((existing) => tag !== existing).join(' ')),
  };

  return (
    <View style={styles.tagsList}>
      {components.map((tag, ii) => (
        <PopoverButton
          key={`tag-${tag}-ii`}
          style={styles.tagCell}
          activeStyle={[styles.tagCell, styles.activeCell]}
          popover={{ ...removeTagPopover, tag }}>
          <FontAwesome5 name="hashtag" color="#888" size={12} />
          <Text style={styles.tagCellLabel}>{tag}</Text>
        </PopoverButton>
      ))}
      {!props?.singleSelect || components.length == 0 ? (
        <PopoverButton
          key="add-tag"
          style={styles.addTagCell}
          activeStyle={[styles.addTagCell, styles.activeCell]}
          popover={addTagPopover}>
          <Text style={styles.addTagCellLabel}>
            {props?.singleSelect ? 'Choose tag' : 'Add tag'}
          </Text>
        </PopoverButton>
      ) : null}
    </View>
  );
};
