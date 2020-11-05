import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CardCell } from '../components/CardCell';
import { useNavigation } from '../ReactNavigation';

const styles = StyleSheet.create({
  parentAttribution: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    padding: 8,
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
    flexShrink: 1,
    flexGrow: 0,
  },
  topCardPreview: {
    maxWidth: '10%',
    marginRight: 8,
    flexShrink: 0,
  },
});

// TODO: navigate when tapped

export const DeckParentAttribution = ({ parentDeckId, parentDeck }) => {
  const { navigate } = useNavigation();
  const navigateToParent = React.useCallback(
    () =>
      navigate('Browse', {
        screen: 'ViewSource',
        params: {
          deckIdToEdit: parentDeckId,
        },
      }),
    [parentDeckId, navigate]
  );

  if (!parentDeckId) {
    return null;
  }
  if (parentDeckId && !parentDeck) {
    // TODO: parent deck is not accessible
  }
  return (
    <TouchableOpacity style={styles.parentAttribution} onPress={navigateToParent}>
      <View style={styles.topCardPreview}>
        <CardCell card={parentDeck.initialCard} />
      </View>
      <Text style={styles.label}>
        This deck was originally copied from {parentDeck.creator?.username}'s deck.
      </Text>
    </TouchableOpacity>
  );
};
