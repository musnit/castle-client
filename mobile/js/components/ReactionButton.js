import React from 'react';
import { Animated, Pressable as PressableRN, StyleSheet, View } from 'react-native';
import { AppText as Text } from './AppText';
import { gql } from '@apollo/client';
import { SocialCount } from './SocialCount';

import * as Constants from '../Constants';
import * as Session from '../Session';
import * as Utilities from '../common/utilities';

import debounce from 'lodash.debounce';

import { TouchableNativeFeedback as PressableRNGH } from 'react-native-gesture-handler';

// required because android Pressable doesn't receive touches outside parent container
// waiting for merge: https://github.com/facebook/react-native/pull/29039
const Pressable = Constants.iOS ? PressableRN : PressableRNGH;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SPRING_CONFIG = {
  tension: 100,
  friction: 50,
  overshootClamping: true,
  useNativeDriver: true,
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  deckActionIcon: {
    ...Constants.styles.textShadow,
  },
});

const makeOptimisticCount = (initial, optimistic) => {
  if (initial === optimistic) return 0;
  if (!initial && optimistic) return 1;
  if (initial && !optimistic) return -1;
};

const toggleReaction = async ({ reactionId, deck, enabled }) => {
  const result = await Session.apolloClient.mutate({
    mutation: gql`
      mutation ($reactionId: ID!, $deckId: ID!, $enabled: Boolean!) {
        toggleReaction(reactionId: $reactionId, deckId: $deckId, enabled: $enabled) {
          id
          reactionId
          count
          isCurrentUserToggled
        }
      }
    `,
    variables: { reactionId, deckId: deck.deckId, enabled },
    update: (cache, { data }) => {
      // https://www.apollographql.com/docs/react/caching/cache-interaction/#example-updating-the-cache-after-a-mutation
      cache.modify({
        id: cache.identify(deck),
        fields: {
          reactions(_, { DELETE }) {
            const newReactions = data.toggleReaction;
            let newReactionsRefs = newReactions.map((reaction) =>
              cache.writeFragment({
                data: reaction,
                fragment: gql`
                  fragment Reactions on Reaction {
                    id
                    reactionId
                    count
                    isCurrentUserToggled
                  }
                `,
              })
            );
            return newReactionsRefs;
          },
        },
      });
    },
  });
  return result;
};

const toggleReactionDebounce = debounce(toggleReaction, 100);

export const ReactionButton = ({ deck, iconSize = 22 }) => {
  let deckId, reactions;
  if (deck) {
    deckId = deck.deckId;
    reactions = deck.reactions;
  }
  const buttonScale = React.useRef(new Animated.Value(1)).current;

  let fire;
  if (reactions?.length) {
    fire = reactions.find((reaction) => reaction.reactionId === Constants.reactionIds.fire);
  }

  let initialIsSelected = fire?.isCurrentUserToggled;
  const [isSelected, toggleSelected] = React.useReducer((state, action) => {
    toggleReactionDebounce({
      reactionId: Constants.reactionIds.fire,
      enabled: !state,
      ...action,
    });
    return !state;
  }, initialIsSelected);

  const onPress = React.useCallback(() => {
    toggleSelected({ deck });
    Animated.stagger(100, [
      Animated.spring(buttonScale, { toValue: 2, ...SPRING_CONFIG }),
      Animated.spring(buttonScale, { toValue: 1, ...SPRING_CONFIG }),
    ]).start();
  }, [deck]);

  return (
    <View style={styles.container}>
      <AnimatedPressable onPress={onPress} style={{ transform: [{ scale: buttonScale }] }}>
        <Constants.CastleIcon
          name={isSelected ? 'fire-on' : 'fire-off'}
          color="#fff"
          size={iconSize}
          style={styles.deckActionIcon}
        />
      </AnimatedPressable>
      <SocialCount
        count={fire?.count}
        optimisticCount={makeOptimisticCount(initialIsSelected, isSelected)}
      />
    </View>
  );
};
