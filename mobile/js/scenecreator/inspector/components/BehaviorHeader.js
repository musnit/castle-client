import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontWeight: 'bold',
  },
  removeButton: {
    marginLeft: 8,
  },
});

export const BehaviorHeader = ({ name, onRemove }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.name}>{name}</Text>
      {onRemove ? (
        <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
          <Icon name="delete" size={22} color="#000" />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};
