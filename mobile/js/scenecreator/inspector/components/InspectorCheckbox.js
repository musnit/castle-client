import * as React from 'react';
import { StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  box: {
    backgroundColor: '#000',
    borderRadius: 3,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginRight: 16,
  },
  label: {},
});

export const InspectorCheckbox = ({ value, label, onChange, style, ...props }) => {
  const onPress = React.useCallback(() => onChange(!value), [value, onChange]);
  return (
    <View style={[styles.container, style]} {...props}>
      <TouchableWithoutFeedback onPress={onPress}>
        <View style={styles.box}>
          {value && <FontAwesome name="check" size={14} color="#fff" />}
        </View>
      </TouchableWithoutFeedback>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};
