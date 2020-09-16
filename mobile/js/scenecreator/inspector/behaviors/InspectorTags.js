import * as React from 'react';
import { StyleSheet, TouchableOpacity, Text, View } from 'react-native';
import { DropdownItemsList } from '../components/InspectorDropdown';
import { PopoverButton } from '../../PopoverProvider';
import { useOptimisticBehaviorValue } from '../InspectorUtilities';

import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  label: {
    fontWeight: 'bold',
    paddingBottom: 16,
    fontSize: 16,
  },
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
});

export default InspectorTags = ({ tags, sendAction }) => {
  const [value, setValueAndSendAction] = useOptimisticBehaviorValue({
    behavior: tags,
    propName: 'tagsString',
    sendAction,
  });

  const [components, setComponents] = React.useState([]);

  const tagToActorIds = tags?.properties.tagToActorIds;
  const [tagsToAdd, setTagsToAdd] = React.useState();

  const onChange = React.useCallback(
    (tagsString) => {
      if (tags.isActive) {
        setValueAndSendAction('set:tagsString', tagsString);
      } else {
        console.warn(`Expect all actors to have Tags, but this actor did not`);
        setValueAndSendAction('add', tagsString, { tagsString });
      }
    },
    [tags.isActive, sendAction, setValueAndSendAction]
  );

  React.useEffect(() => {
    setComponents(
      value
        .split(' ')
        .sort((a, b) => a.localeCompare(b))
        .map((component) => component.toLowerCase())
    );
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

  const addTagPopover = {
    Component: DropdownItemsList,
    items: tagsToAdd,
    height: 192,
    showAddItem: true,
    onSelectItem: (item) => onChange(`${value} ${item.id}`),
    onAddItem: (item) => onChange(`${value} ${item}`),
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Tags</Text>
      <View style={styles.tagsList}>
        {components.map((tag, ii) => (
          <TouchableOpacity key={`tag-${tag}-ii`} style={styles.tagCell}>
            <FontAwesome5 name="hashtag" color="#888" size={12} />
            <Text style={styles.tagCellLabel}>{tag}</Text>
          </TouchableOpacity>
        ))}
        <PopoverButton
          key="add-tag"
          style={styles.addTagCell}
          activeStyle={[styles.addTagCell, styles.activeCell]}
          popover={addTagPopover}>
          <Text style={styles.addTagCellLabel}>Add tag</Text>
        </PopoverButton>
      </View>
    </View>
  );
};
