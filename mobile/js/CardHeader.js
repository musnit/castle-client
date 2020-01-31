import React from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';

import ConfigureInput from './ConfigureInput';

const styles = StyleSheet.create({
  container: {
    zIndex: 1, // we use negative margin to place the scene behind the header
  },
  drawer: {},
  cardTop: {
    backgroundColor: 'transparent',
    flexShrink: 0,
  },
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
  titleContainer: {
    width: '100%',
    flexShrink: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -54, // required to center properly with back button
    zIndex: -1, // required to prevent negative margin from blocking back button
  },
  name: {
    color: '#888',
    padding: 4,
  },
  deleteButton: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#c00',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  deleteLabel: {
    color: '#f00',
  },
});

const ConfigureCard = (props) => {
  return (
    <View style={{ minHeight: 48, padding: 16, marginTop: 42, marginBottom: 16 }}>
      <ConfigureInput
        label="Short Name"
        placeholder="Choose a name for this card"
        value={props.card.title}
        onChangeText={(title) => props.onChange({ title })}
      />
      {props.card.cardId && (
        <TouchableOpacity style={styles.deleteButton} onPress={props.onDeleteCard}>
          <Text style={styles.deleteLabel}>Delete Card</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const CardHeader = (props) => {
  const { card, expanded } = props;
  const title = card.title ? card.title : 'Untitled Card';
  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />
      <View style={styles.drawer}>
        {expanded ? (
          <ConfigureCard card={card} onChange={props.onChange} onDeleteCard={props.onDeleteCard} />
        ) : null}
        <View style={[styles.cardTop, { marginBottom: expanded ? 12 : -54 }]} />
      </View>
      <View style={styles.fixedHeader}>
        <TouchableOpacity style={styles.back} onPress={props.onPressBack}>
          <FastImage
            style={{
              width: 22,
              aspectRatio: 1,
            }}
            source={require('../assets/images/dismiss.png')}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.titleContainer} onPress={props.onPressTitle}>
          <Text style={[styles.name, { backgroundColor: expanded ? 'transparent' : '#f2f2f2' }]}>
            {title}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CardHeader;
