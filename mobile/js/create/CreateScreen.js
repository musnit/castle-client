import React from 'react';
import {
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Amplitude } from '@amplitude/react-native';
import { AppText as Text } from '../components/AppText';
import { AuthPrompt } from '../auth/AuthPrompt';
import { CardCell } from '../components/CardCell';
import { useNavigation, useFocusEffect, ANDROID_USE_NATIVE_NAVIGATION } from '../ReactNavigation';
import { EmptyFeed } from '../home/EmptyFeed';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLazyQuery, gql } from '@apollo/client';
import { useSession } from '../Session';
import { SegmentedNavigation } from '../components/SegmentedNavigation';
import { UnsavedCardsList } from './UnsavedCardsList';
import { formatCount } from '../common/utilities';
import { formatTimeInterval } from '../common/date-utilities';

import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import AntIcon from 'react-native-vector-icons/AntDesign';
import FastImage from 'react-native-fast-image';

import * as Constants from '../Constants';

const styles = StyleSheet.create({
  newDeckIcon: {
    width: 16,
    height: 16,
    marginLeft: -2,
    marginRight: 6,
  },
  tabTitle: {
    padding: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Constants.colors.grayOnBlackBorder,
    flexDirection: 'row',
  },
  tabTitleText: {
    fontSize: 32,
    lineHeight: 36,
    fontFamily: 'Basteleur-Bold',
    color: '#fff',
    flex: 1,
  },
  navWrapper: {
    backgroundColor: '#000',
    marginTop: -1, // hide the border built into ScreenHeader
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: Constants.colors.grayOnBlackBorder,
  },
  gridContainer: {
    paddingTop: Constants.GRID_PADDING * 2,
    paddingLeft: Constants.GRID_PADDING,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  deckStats: {
    paddingTop: 6,
    paddingBottom: 4,
    flexDirection: 'row',
  },
  deckStatsColumn: {
    flex: 1,
    alignItems: 'center',
  },
  statCountLabel: {
    color: Constants.colors.grayText,
    fontSize: 12,
    marginTop: 1,
  },
  help: {
    paddingRight: 8,
    paddingBottom: 16,
    width: '100%',
  },
  helpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  helpHeaderText: {
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  helpRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: '#888',
    paddingVertical: 12,
    alignItems: 'center',
  },
  helpRowLabel: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
    marginRight: 12,
  },
  helpRowButton: {},
});

const EditDecksList = ({ fetchDecks, refreshing, filteredDecks, error }) => {
  const { push } = useNavigation();
  const refreshControl = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={fetchDecks}
      tintColor="#fff"
      colors={['#fff', '#ccc']}
    />
  );

  if (error) {
    return <EmptyFeed error={error} onRefresh={fetchDecks} />;
  }

  if (!refreshing && filteredDecks?.length === 0) {
    return (
      <>
        <View style={Constants.styles.empty}>
          <Text style={Constants.styles.emptyTitle}>No decks... yet!</Text>
          <Text style={Constants.styles.emptyText}>
            Create your first deck by tapping the button above, or remix an existing deck.
          </Text>
        </View>
        <View style={{ paddingLeft: 8 }}>
          <CreateHelpLinks />
        </View>
      </>
    );
  }

  if (!filteredDecks || filteredDecks.length > 0) {
    return (
      <ScrollView contentContainerStyle={styles.gridContainer} refreshControl={refreshControl}>
        {filteredDecks
          ? filteredDecks.map((deck) => (
              <EditDeckCell
                key={deck.deckId}
                deck={deck}
                onPress={() => {
                  push(
                    'CreateDeck',
                    {
                      deckIdToEdit: deck.deckId,
                    },
                    { isFullscreen: true }
                  );
                }}
              />
            ))
          : null}
        <CreateHelpLinks />
      </ScrollView>
    );
  }
  return null;
};

const EditDeckCell = (props) => {
  const { deck, onPress } = props;

  return (
    <View style={[Constants.styles.gridItem, { width: '33.3%' }]}>
      <CardCell
        card={deck.initialCard}
        onPress={onPress}
        visibility={deck.visibility}
        showVisibility={true}
        playCount={deck.playCount}
        inGrid={true}
      />
      <View style={styles.deckStats}>
        {deck.playCount ? (
          <>
            <View style={styles.deckStatsColumn}>
              <MCIcon size={14} name="eye-outline" color={Constants.colors.grayText} />
              <Text style={styles.statCountLabel}>{formatCount(deck.playCount)}</Text>
            </View>
            <View style={styles.deckStatsColumn}>
              <MCIcon size={14} name="timer-outline" color={Constants.colors.grayText} />
              <Text style={styles.statCountLabel}>{formatTimeInterval(deck.playTime)}</Text>
            </View>
            <View style={styles.deckStatsColumn}>
              <MCIcon size={14} name="fire" color={Constants.colors.grayText} />
              <Text style={styles.statCountLabel}>
                {deck.reactions?.length ? formatCount(deck.reactions[0].count) : '-'}
              </Text>
            </View>
          </>
        ) : (
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={styles.statCountLabel}>---</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const CreateHelpLinks = () => {
  const onPressHelpLink = React.useCallback((url) => {
    Amplitude.getInstance().logEvent('OPEN_CREATE_HELP_LINK', {
      url,
    });
    Linking.openURL(url);
  }, []);
  return (
    <View style={styles.help}>
      <View style={styles.helpHeader}>
        <FastImage
          style={{ width: 23, height: 24, marginRight: 12 }}
          source={require('../../assets/images/emoji/key-white.png')}
        />
        <Text style={styles.helpHeaderText}>Looking for help?</Text>
      </View>
      <View style={styles.helpRow}>
        <Text style={styles.helpRowLabel}>Read through our official written tutorials</Text>
        <Pressable
          style={[Constants.styles.secondaryButton, styles.helpRowButton]}
          onPress={() => onPressHelpLink(Constants.DOCS_LINK)}>
          <Text style={Constants.styles.secondaryButtonLabel}>Browse Docs</Text>
        </Pressable>
      </View>
      <View style={styles.helpRow}>
        <Text style={styles.helpRowLabel}>Ask questions, leave feedback, hang out</Text>
        <Pressable
          style={[Constants.styles.secondaryButton, styles.helpRowButton]}
          onPress={() => onPressHelpLink(Constants.DISCORD_INVITE_LINK)}>
          <Text style={Constants.styles.secondaryButtonLabel}>Join Discord</Text>
        </Pressable>
      </View>
    </View>
  );
};

const filterDecks = (decks, filter) => {
  if (decks?.length) {
    switch (filter) {
      case 'private':
      case 'unlisted':
      case 'public':
        return decks.filter((d) => d.visibility === filter);
      case 'recovered':
        // use different view for this tab
        return [];
        break;
      case 'recent':
      default:
        return decks.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
    }
  } else {
    return [];
  }
};

export const CreateScreen = () => {
  const { isAnonymous } = useSession();

  if (isAnonymous) {
    return (
      <AuthPrompt
        title="Create interactive cards"
        message="Make digital toys, living doodles, or tiny games."
      />
    );
  } else {
    return <CreateScreenAuthenticated />;
  }
};

const TAB_ITEMS = [
  {
    name: 'Recent',
    value: 'recent',
  },
  {
    name: 'Private',
    value: 'private',
  },
  {
    name: 'Unlisted',
    value: 'unlisted',
  },
  {
    name: 'Public',
    value: 'public',
  },
  {
    name: 'Recovered',
    value: 'recovered',
  },
];

const CreateScreenAuthenticated = () => {
  const { navigate } = useNavigation();

  // maintain decks, filter, and filtered decks atomically
  // so there isn't a flicker between setting decks and computing filtered decks
  const [decks, setDecks] = React.useReducer(
    (state, action) => {
      switch (action.type) {
        case 'all':
          return {
            ...state,
            decks: action.decks,
            filteredDecks: filterDecks(action.decks, state.filter),
          };
        case 'filter':
          return {
            ...state,
            filter: action.filter,
            filteredDecks: filterDecks(state.decks, action.filter),
          };
      }
    },
    { filter: 'recent', decks: undefined, filteredDecks: undefined }
  );

  const [error, setError] = React.useState();
  const [fetchDecks, query] = useLazyQuery(
    gql`
      query Me {
        me {
          id
          userId
          decks {
            id
            deckId
            title
            visibility
            lastModified
            playCount
            playTime
            variables
            initialCard {
              id
              cardId
              sceneDataUrl
              title
              backgroundImage {
                url
                smallUrl
              }
            }
            reactions {
              count
            }
          }
        }
      }
    `,
    { fetchPolicy: 'no-cache' }
  );

  useFocusEffect(
    React.useCallback(() => {
      StatusBar.setBarStyle('light-content'); // needed for tab navigator
      Amplitude.getInstance().logEvent('VIEW_CREATE');
      fetchDecks();
    }, [])
  );

  React.useEffect(() => {
    if (query.called && !query.loading) {
      if (query.data) {
        const decks = query.data.me.decks;
        if (decks) {
          setDecks({ type: 'all', decks });
        } else {
          setDecks({ type: 'all', decks: [] });
        }
        setError(undefined);
      } else if (query.error) {
        setError(query.error);
      }
    } else {
      setError(undefined);
    }
  }, [query.called, query.loading, query.error, query.data]);

  const onPressCreateDeck = React.useCallback(() => {
    if (Constants.iOS || !ANDROID_USE_NATIVE_NAVIGATION) {
      // use native modal on iOS
      navigate('ModalCreateDeckNavigator', { screen: 'CreateChooseKitScreen' });
    } else {
      // use separate root navigator on Android
      navigate('CreateChooseKitScreen', {}, { isFullscreen: true });
    }
  }, [navigate]);

  const onUnsavedCardRestored = React.useCallback(() => {
    // after restoring an unsaved card, go back to recent tab and refetch decks,
    // assuming the restored card caused a deck to be newly visible here
    setDecks({ type: 'filter', filter: 'recent' });
    fetchDecks();
  }, [setDecks, fetchDecks]);

  return (
    <SafeAreaView style={Constants.styles.container} edges={['left', 'right', 'bottom']}>
      <View style={styles.tabTitle}>
        <Text style={styles.tabTitleText}>Create</Text>
        <View style={styles.tabTitleAction}>
          <TouchableOpacity style={Constants.styles.primaryButton} onPress={onPressCreateDeck}>
            <FastImage
              style={styles.newDeckIcon}
              source={require('../../assets/images/create-card.png')}
            />
            <Text style={Constants.styles.primaryButtonLabel}>New Deck</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.navWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <SegmentedNavigation
            items={TAB_ITEMS}
            onSelectItem={(item) => setDecks({ type: 'filter', filter: item.value })}
            selectedItem={TAB_ITEMS.find((item) => item.value === decks.filter)}
            compact={true}
          />
        </ScrollView>
      </View>
      {decks.filter === 'recovered' ? (
        <UnsavedCardsList onCardChosen={onUnsavedCardRestored} />
      ) : (
        <EditDecksList
          fetchDecks={fetchDecks}
          refreshing={query.loading}
          filteredDecks={decks.filteredDecks}
          error={error}
        />
      )}
    </SafeAreaView>
  );
};
