import React from 'react';
import { Animated, Pressable as PressableRN, StyleSheet, Text, View } from 'react-native';
import { gql } from '@apollo/client';

import * as Constants from '../Constants';
import * as Session from '../Session';

import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

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
    ...Constants.styles.dropShadow,

    // TODO: actual react button
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const countStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: -6,
    bottom: -4,
    padding: 2,
    backgroundColor: '#000',
    borderRadius: 2,
    minWidth: 12,
  },
  label: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
});

const makeOptimisticCount = (initial, optimistic) => {
  if (initial === optimistic) return 0;
  if (!initial && optimistic) return 1;
  if (initial && !optimistic) return -1;
};

const toggleReaction = async ({ userId, reactionId, deck, enabled }) => {
  const result = await Session.apolloClient.mutate({
    mutation: gql`
      mutation($reactionId: ID!, $deckId: ID!, $enabled: Boolean!) {
        toggleReaction(reactionId: $reactionId, deckId: $deckId, enabled: $enabled) {
          id
          reactionId
          count
          users {
            userId
          }
        }
      }
    `,
    variables: { reactionId, deckId: deck.deckId, enabled },
    update: (cache, { data }) => {
      // not working: https://www.apollographql.com/docs/react/caching/cache-interaction/#example-updating-the-cache-after-a-mutation
      cache.modify({
        id: cache.identify(deck),
        fields: {
          reactions(_, { DELETE }) {
            const newReactions = data.toggleReaction;
            if (!newReactions?.length) {
              return DELETE;
            } else {
              let newReactionsRefs = newReactions.map((reaction) =>
                cache.writeFragment({
                  data: reaction,
                  fragment: gql`
                    fragment Reactions on Reaction {
                      id
                      reactionId
                      count
                      users {
                        userId
                      }
                    }
                  `,
                })
              );
              return newReactionsRefs;
            }
          },
        },
      });
    },
  });
  return result;
};

const ReactionCount = ({ reaction, optimisticCount }) => {
  const totalCount = (reaction?.count ?? 0) + (optimisticCount ?? 0);
  if (!totalCount) return null;
  return (
    <View style={countStyles.container} pointerEvents="none">
      <Text style={countStyles.label}>{totalCount}</Text>
    </View>
  );
};

export const ReactionButton = ({ deck }) => {
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

  let initialIsSelected = false; // TODO: use top level gql field for this
  const { userId } = Session.useSession();
  if (fire?.users) {
    let me = fire.users.find((u) => u.userId === userId);
    initialIsSelected = me !== undefined;
  }
  const [isSelected, toggleSelected] = React.useReducer((state, action) => {
    toggleReaction({
      reactionId: Constants.reactionIds.fire,
      enabled: !state,
      ...action,
    });
    return !state;
  }, initialIsSelected);

  const onPress = React.useCallback(() => {
    toggleSelected({ userId, deck });
    Animated.stagger(100, [
      Animated.spring(buttonScale, { toValue: 2, ...SPRING_CONFIG }),
      Animated.spring(buttonScale, { toValue: 1, ...SPRING_CONFIG }),
    ]).start();
  }, [userId, deck]);

  return (
    <AnimatedPressable
      onPress={onPress}
      style={[styles.container, { transform: [{ scale: buttonScale }] }]}>
      <FontAwesome5 name="fire-alt" size={24} color={isSelected ? '#f00' : '#000'} />
      <ReactionCount
        reaction={fire}
        optimisticCount={makeOptimisticCount(initialIsSelected, isSelected)}
      />
    </AnimatedPressable>
  );
};
