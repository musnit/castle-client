import * as React from 'react';
import { StyleSheet, Pressable, View } from 'react-native';
import { AppText as Text } from '../../../components/AppText';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import * as Constants from '../../../Constants';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  box: {
    backgroundColor: '#fff',
    borderWidth: 1,
    ...Constants.styles.dropShadow,
    borderColor: '#000',
    borderRadius: 3,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  label: {
    fontSize: 16,
    marginRight: 16,
  },
});

export const InspectorCheckbox = ({ value, label, onChange, style, ...props }) => {
  const onPress = React.useCallback(() => onChange(!value), [value, onChange]);
  return (
    <View style={[styles.container, style]} {...props}>
      {label?.length ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable onPress={onPress} style={styles.box}>
        {value ? <Constants.CastleIcon name="checkmark" size={22} color="#000" /> : null}
      </Pressable>
    </View>
  );
};
