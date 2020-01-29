import React from 'react';
import gql from 'graphql-tag';
import { TouchableWithoutFeedback, ScrollView, StyleSheet, View } from 'react-native';
import SafeAreaView from 'react-native-safe-area-view';
import { useNavigation } from 'react-navigation-hooks';

import CardHeader from './CardHeader';
import CardBlocks from './CardBlocks';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
    flexShrink: 1,
    backgroundColor: '#f2f2f2',
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  scene: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 1,
  },
  description: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
});

const PlayCardScreen = (props) => {
  const navigation = useNavigation();

  const _handlePressScene = () => {
    // TODO: go to scene for this card
  };

  const _handleSelectBlock = (block) => {
    // TODO: go to card for this block
  };

  const card = {}; // TODO: load card

  return (
    <SafeAreaView style={styles.container}>
      <CardHeader card={card} onPressBack={() => navigation.navigate('HomeScreen')} />
      <ScrollView style={styles.scrollView} contentContainerStyle={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={_handlePressScene}>
          <View style={styles.scene} />
        </TouchableWithoutFeedback>
        <View style={styles.description}>
          <CardBlocks card={card} onSelectBlock={_handleSelectBlock} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PlayCardScreen;
