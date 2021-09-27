import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSession } from '../Session';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#fff',
    lineHeight: 32,
  },
});

export const NuxScreen = () => {
  const { setIsNuxCompleted } = useSession();
  return (
    <View style={styles.container}>
      <Pressable onPress={() => setIsNuxCompleted(true)}>
        <Text style={styles.label}>I finished the NUX, I swear</Text>
      </Pressable>
    </View>
  );
};
