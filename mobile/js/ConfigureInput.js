import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

const styles = StyleSheet.create({
  inputLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 8,
    color: '#888',
  },
  input: {
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#888',
    padding: 8,
    color: '#fff',
  },
});

const ConfigureInput = (props) => {
  const { label } = props;
  return (
    <View>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput style={styles.input} placeholderTextColor="#666" {...props} />
    </View>
  );
};

export default ConfigureInput;
