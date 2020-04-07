import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

const styles = StyleSheet.create({
  cell: {
    backgroundColor: '#fff',
    height: 100,
    margin: 8,
    padding: 8,
  },
});

const items = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const AppPerfTest = () => {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f00',
      }}>
      <ScrollView style={{ flex: 1, width: '100%' }} contentContainerStyle={{ flexGrow: 1 }}>
        {items.map((item, ii) => (
          <View key={ii} style={styles.cell}>
            <Text>{item}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default AppPerfTest;
