import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import FastImage from 'react-native-fast-image';

const styles = StyleSheet.create({
  fixedHeader: {
    width: '100%',
    height: 54,
    position: 'absolute',
    top: 0,
    height: 54,
    flexDirection: 'row',
  },
  back: {
    flexShrink: 0,
    width: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    marginTop: 54,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 24,
  },
});

const DeckHeader = (props) => {
  const { deck } = props;
  return (
    <View>
      <View style={styles.fixedHeader}>
        <TouchableOpacity style={styles.back} onPress={props.onPressBack}>
          <FastImage
            style={{
              width: 22,
              aspectRatio: 1,
            }}
            source={require('../assets/images/arrow-left.png')}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.header}>
        <Text style={styles.title}>{deck && deck.title}</Text>
      </View>
    </View>
  );
};

export default DeckHeader;
