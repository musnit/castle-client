import * as React from 'react';
import { StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  box: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderBottomWidth: 2,
    borderColor: '#000',
    borderRadius: 3,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginLeft: 16,
  },
  label: {
    fontSize: 16,
  },
});

export const InspectorCheckbox = ({ value, label, onChange, style, ...props }) => {
  const onPress = React.useCallback(() => onChange(!value), [value, onChange]);
  return (
    <View style={[styles.container, style]} {...props}>
      <Text style={styles.label}>{label}</Text>
      <TouchableWithoutFeedback onPress={onPress}>
        <View style={styles.box}>
          {value ? <FontAwesome name="check" size={18} color="#000" /> : null}
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
};
