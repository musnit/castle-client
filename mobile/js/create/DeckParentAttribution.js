import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppText as Text } from '../components/AppText';
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
  grey: {
    color: '#999',
  },
});

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
    // parent deck is not accessible (author deleted it or made it private)
    return (
      <Text style={[styles.label, styles.grey]}>
        This deck is a remix of a different deck which is no longer available.
      </Text>
    );
  }
  return (
    <TouchableOpacity style={styles.parentAttribution} onPress={navigateToParent}>
      <View style={styles.topCardPreview}>
        <CardCell card={parentDeck.initialCard} inGrid={true} />
      </View>
      <Text style={styles.label}>
        This deck is a remix of @{parentDeck.creator?.username}'s deck.
      </Text>
    </TouchableOpacity>
  );
};
