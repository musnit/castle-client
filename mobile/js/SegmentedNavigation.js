import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  item: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  selectedItem: {
    borderBottomWidth: 2,
    borderColor: '#fff',
  },
  name: {
    color: '#ccc',
  },
  selectedName: {
    color: '#fff',
  },
});

const SegmentedNavigation = (props) => {
  const { items, selectedItem, onSelectItem } = props;
  return (
    <View style={styles.container}>
      {items.map((item) => (
        <TouchableOpacity
          key={item.value}
          style={[styles.item, item === selectedItem ? styles.selectedItem : null]}
          onPress={() => onSelectItem(item)}>
          {item.icon ? (
            <MCIcon name={item.icon} size={24} color={item === selectedItem ? '#fff' : '#ccc'} />
          ) : (
            <Text style={[styles.name, item === selectedItem ? styles.selectedName : null]}>
              {item.name}
            </Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default SegmentedNavigation;
