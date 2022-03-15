import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText as Text } from '../../../components/AppText';

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderColor: '#ccc',
    padding: 16,
  },
  label: {
    fontWeight: 'bold',
    paddingBottom: 16,
    fontSize: 16,
  },
  sublabel: {
    fontWeight: 'normal',
  },
});

export default InspectorImage = ({ image }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        Image <Text style={styles.sublabel}>(legacy)</Text>
      </Text>
    </View>
  );
};
