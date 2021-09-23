import React from 'react';
import {
  Linking,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AuthPrompt } from '../auth/AuthPrompt';
import { CardCell } from '../components/CardCell';
import { useNavigation, useFocusEffect } from '../ReactNavigation';
import { EmptyFeed } from '../home/EmptyFeed';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLazyQuery, gql } from '@apollo/client';
import { useSession } from '../Session';
import { SegmentedNavigation } from '../components/SegmentedNavigation';

import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import AntIcon from 'react-native-vector-icons/AntDesign';

import * as Amplitude from 'expo-analytics-amplitude';
import * as Constants from '../Constants';
import * as LocalId from '../common/local-id';

const styles = StyleSheet.create({
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
    backgroundColor: '#000',
    flexDirection: 'row',
  },
  deckStatsColumn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  playCountLabel: {
    color: Constants.colors.grayText,
    fontSize: 12,
    marginLeft: 2,
  },
});

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
        <View style={styles.deckStatsColumn}>
          <MCIcon size={16} name="play" color={Constants.colors.grayText} />
          <Text style={styles.playCountLabel}>{deck.playCount || '--'}</Text>
        </View>
        {deck.reactions?.length ? (
          <View style={styles.deckStatsColumn}>
            <MCIcon size={16} name="fire" color={Constants.colors.grayText} />
            <Text style={styles.playCountLabel}>{deck.reactions[0].count}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
};

export const CreateScreen = () => {
  const { isAnonymous } = useSession();

  if (isAnonymous) {
    return (
      <SafeAreaView>
        <AuthPrompt
          title="Create interactive cards"
          message="Make digital toys, living doodles, or tiny games."
        />
      </SafeAreaView>
    );
  } else {
    return <CreateScreenAuthenticated />;
  }
};

const CreateScreenAuthenticated = () => {
  const navigation = useNavigation();
  const [decks, setDecks] = React.useState(undefined);
  const [error, setError] = React.useState(undefined);
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
            initialCard {
              id
              cardId
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
      Amplitude.logEvent('VIEW_CREATE');
      fetchDecks();
    }, [])
  );

  React.useEffect(() => {
    if (query.called && !query.loading) {
      if (query.data) {
        const decks = query.data.me.decks;
        if (decks) {
          setDecks(decks.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified)));
        }
        setError(undefined);
      } else if (query.error) {
        setError(query.error);
      }
    } else {
      setError(undefined);
    }
  }, [query.called, query.loading, query.error, query.data]);

  const refreshControl = (
    <RefreshControl
      refreshing={query.loading}
      onRefresh={fetchDecks}
      tintColor="#fff"
      colors={['#fff', '#ccc']}
    />
  );

  const [filter, setFilter] = React.useState('recent');

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

  return (
    <SafeAreaView style={Constants.styles.container} edges={['top']}>
      <View style={styles.tabTitle}>
        <Text style={styles.tabTitleText}>Create</Text>
        <View style={styles.tabTitleAction}>
          <TouchableOpacity
            style={Constants.styles.primaryButton}
            onPress={() => {
              navigation.push(
                'CreateDeck',
                {
                  deckIdToEdit: LocalId.makeId(),
                  cardIdToEdit: LocalId.makeId(),
                },
                { isFullscreen: true }
              );
            }}>
            <AntIcon
              size={16}
              color="#000"
              name="plus"
              style={Constants.styles.primaryButtonIconLeft}
            />
            <Text style={Constants.styles.primaryButtonLabel}>New Deck</Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* <View style={styles.navWrapper}>
        <ScrollView horizontal>
          <SegmentedNavigation
            items={TAB_ITEMS}
            onSelectItem={(item) => setFilter(item.value)}
            selectedItem={TAB_ITEMS.find((item) => item.value === filter)}
            compact={true}
          />
        </ScrollView>
      </View> */}

      {decks && decks.length === 0 && (
        <View style={Constants.styles.empty}>
          <Text style={Constants.styles.emptyTitle}>No decks... yet!</Text>
          <Text style={Constants.styles.emptyText}>
            Create your first deck by tapping the button above, or remix an existing deck.
          </Text>
          <Text style={[Constants.styles.emptyText, { marginTop: 16 }]}>
            Want help or inspiration?{' '}
            <Text
              style={{ color: '#fff' }}
              onPress={() => Linking.openURL(Constants.DISCORD_INVITE_LINK)}>
              Join our Discord!
            </Text>
          </Text>
        </View>
      )}

      {error ? (
        <EmptyFeed error={error} onRefresh={fetchDecks} />
      ) : (
        (!decks || decks.length > 0) && (
          <ScrollView contentContainerStyle={styles.gridContainer} refreshControl={refreshControl}>
            {decks &&
              decks.map((deck) => (
                <EditDeckCell
                  key={deck.deckId}
                  deck={deck}
                  onPress={() => {
                    navigation.push(
                      'CreateDeck',
                      {
                        deckIdToEdit: deck.deckId,
                      },
                      { isFullscreen: true }
                    );
                  }}
                />
              ))}
          </ScrollView>
        )
      )}
    </SafeAreaView>
  );
};
