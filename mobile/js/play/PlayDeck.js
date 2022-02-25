import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Amplitude } from '@amplitude/react-native';
import { CardScene } from '../game/CardScene';
import { gql } from '@apollo/client';
import { sendAsync, useListen } from '../core/CoreEvents';

import * as AdjustEvents from '../common/AdjustEvents';
import * as Constants from '../Constants';
import * as Sentry from '@sentry/react-native';
import * as Session from '../Session';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: Constants.CARD_BORDER_RADIUS,
    overflow: 'hidden',
  },
  scene: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  textActors: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: 16,
    paddingBottom: 8,
  },
});

const recordDeckPlay = (deckId, cardId) => {
  if (cardId) {
    // this may fire before cardId ref was set
    Session.apolloClient.mutate({
      mutation: gql`
        mutation RecordDeckPlay($deckId: ID!, $cardId: ID) {
          recordDeckPlay(deckId: $deckId, cardId: $cardId)
        }
      `,
      variables: {
        deckId,
        cardId,
      },
    });
  }
};

export const PlayDeck = ({ deck, visibility, route, paused }) => {
  const playingCardId = React.useRef(deck.initialCard?.cardId);
  useListen({
    eventName: 'DID_NAVIGATE_TO_CARD',
    handler: ({ cardId }) => (playingCardId.current = cardId),
  });

  React.useEffect(() => {
    Amplitude.getInstance().logEvent('VIEW_PLAY_DECK', { deckId: deck.deckId, visibility });
    AdjustEvents.trackEvent(AdjustEvents.tokens.PLAY_DECK);
    Sentry.addBreadcrumb({
      category: 'play_deck',
      message: `Play deck with deckId: ${deck.deckId}`,
      level: Sentry.Severity.Info,
    });
    Sentry.setTag('last_deck_id_played', deck.deckId);

    return () => {
      recordDeckPlay(deck.deckId, playingCardId.current);
    };
  }, [deck.deckId, visibility]);

  React.useEffect(() => {
    recordDeckPlay(deck.deckId, playingCardId.current);
    let interval = setInterval(() => {
      recordDeckPlay(deck.deckId, playingCardId.current);
    }, 10 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, [playingCardId.current]);

  return (
    <View style={styles.container}>
      <CardScene
        deck={deck}
        interactionEnabled={true}
        key={`deck-scene-${deck.deckId}`}
        style={styles.scene}
        paused={paused}
      />
    </View>
  );
};
