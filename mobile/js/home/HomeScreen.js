import * as React from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { CommentsSheet } from '../comments/CommentsSheet';
import { FeaturedDecks } from './FeaturedDecks';
import { PopoverProvider } from '../components/PopoverProvider';
import { useFocusEffect, useNavigation } from '../ReactNavigation';
import * as PushNotifications from '../PushNotifications';
import * as Analytics from '../common/Analytics';

import * as Constants from '../Constants';

const styles = StyleSheet.create({
  container: {
    backgroundColor: Constants.colors.black,
    flex: 1,
  },
});

export const HomeScreen = ({ route }) => {
  useNavigation();

  // play a deck within the feed?
  let deckId;
  let deepLinkDeckId;
  if (route?.params) {
    deckId = route.params.deckId;
    deepLinkDeckId = route.params.deepLinkDeckId;
  }

  useFocusEffect(
    React.useCallback(() => {
      StatusBar.setBarStyle('light-content'); // needed for tab navigator
      Analytics.logEventSkipAmplitude('VIEW_HOME', { mode: 'featured' });
    }, [])
  );

  const [commentsState, setCommentsState] = React.useReducer(
    (state, action) => {
      if (action.type === 'open') {
        return {
          isOpen: true,
          deck: action.deck,
        };
      }
      if (action.type === 'close') {
        return {
          ...state,
          isOpen: false,
        };
      }
    },
    {
      isOpen: false,
      deckId: null,
    }
  );
  const openComments = React.useCallback(
    ({ deck }) => setCommentsState({ type: 'open', deck }),
    []
  );
  const closeComments = React.useCallback(() => setCommentsState({ type: 'close' }), []);

  React.useEffect(() => {
    // request permissions and token for push notifs when the home tab is first viewed.
    // whether they accept or deny, subsequent calls to this method won't pop up anything for
    // the user.
    PushNotifications.requestTokenAsync();
  }, []);

  return (
    <View style={styles.container}>
      <PopoverProvider>
        <FeaturedDecks
          deckId={deckId}
          onPressComments={openComments}
          onCloseComments={closeComments}
          isCommentsOpen={commentsState.isOpen}
          deepLinkDeckId={deepLinkDeckId}
        />
        <CommentsSheet
          isFullScreen={!!deckId}
          isOpen={commentsState.isOpen}
          onClose={closeComments}
          deck={commentsState.deck}
        />
      </PopoverProvider>
    </View>
  );
};
