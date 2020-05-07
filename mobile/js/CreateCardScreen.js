import React from 'react';
import gql from 'graphql-tag';
import {
  Keyboard,
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeArea, SafeAreaView } from 'react-native-safe-area-context';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { ReactNativeFile } from 'apollo-upload-client';
import * as GhostUI from './ghost/GhostUI';

import uuid from 'uuid/v4';
import { withNavigation, withNavigationFocus } from '@react-navigation/compat';

import * as Constants from './Constants';
import * as LocalId from './local-id';
import * as Session from './Session';
import * as Utilities from './utilities';

import CardText from './CardText';
import CardHeader from './CardHeader';
import CardScene from './CardScene';
import DeckVariables from './DeckVariables';
import SceneCreatorPanes from './scenecreator/SceneCreatorPanes';
import Viewport from './viewport';

import * as GhostEvents from './ghost/GhostEvents';

import { useGhostUI } from './ghost/GhostUI';
import { getPaneData } from './Tools';

const CARD_HEIGHT = (1 / Constants.CARD_RATIO) * 100 * Viewport.vw;
const TEXT_ACTORS_PANE = 'sceneCreatorTextActors';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cardBody: {
    // contains just the card as a child
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    borderRadius: 6,
    aspectRatio: Constants.CARD_RATIO,
    width: '100%',
  },
  scrollViewContentContainer: {
    flex: 1,
    borderRadius: 6,
    overflow: 'hidden',
  },
  scene: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  cardBackgroundContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexShrink: 1,
  },
  sceneActions: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  primaryButton: {
    ...Constants.styles.primaryButton,
    ...Constants.styles.dropShadow,
  },
  primaryButtonLabel: {
    ...Constants.styles.primaryButtonLabel,
  },
  actions: {
    width: '100%',
    paddingHorizontal: 8,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

const PrimaryButton = ({ style, ...props }) => {
  const buttonProps = { ...props, children: undefined };
  return (
    <TouchableOpacity style={[styles.primaryButton, style]} {...buttonProps}>
      <Text style={styles.primaryButtonLabel}>{props.children}</Text>
    </TouchableOpacity>
  );
};

const CardBottomActions = ({ card, onAdd, onSave }) => {
  return (
    <View style={styles.actions}>
      <PrimaryButton onPress={onAdd}>Add</PrimaryButton>
      <PrimaryButton onPress={onSave}>Done</PrimaryButton>
    </View>
  );
};

const CardTextPane = (props) => {
  const { root } = useGhostUI();

  let textActors;
  if (root && root.panes) {
    const data = getPaneData(root.panes[TEXT_ACTORS_PANE]);
    if (data) {
      textActors = data.textActors;
    }
  }

  return (
    <View style={{ marginTop: 64 }}>
      <CardText textActors={textActors} {...props} />
    </View>
  );
};

const EMPTY_DECK = {
  title: '',
  cards: [],
  variables: [],
};

const EMPTY_BLOCK = {
  title: null,
  type: 'text',
  destination: null,
};

// height of safe area + tab bar on iPhone X family
const IPHONEX_BOTTOM_SAFE_HEIGHT = 83 + 33;
const ANDROID_BOTTOM_KEYBOARD_OFFSET = 64;

class CreateCardScreenDataProvider extends React.Component {
  state = {
    deck: EMPTY_DECK,
    card: Constants.EMPTY_CARD,
    deckState: { variables: [] },
  };

  componentDidMount() {
    this._mounted = true;
    this._update(null, this.props);
  }

  componentDidUpdate(prevProps, prevState) {
    this._update(prevProps, this.props);
  }

  componentWillUnmount() {
    this._mounted = false;
  }

  _update = async (prevProps, props) => {
    const prevDeckIdToEdit =
      prevProps && prevProps.route.params ? prevProps.route.params.deckIdToEdit : undefined;
    const prevCardIdToEdit =
      prevProps && prevProps.route.params ? prevProps.route.params.cardIdToEdit : undefined;
    const params = props.route.params || {};
    if (
      !prevProps ||
      prevDeckIdToEdit !== params.deckIdToEdit ||
      prevCardIdToEdit !== params.cardIdToEdit ||
      (props.isFocused && !prevProps.isFocused)
    ) {
      if (!params.deckIdToEdit || !params.cardIdToEdit) {
        throw new Error(`CreateCardScreen requires a deck id and card id`);
      }

      let deck = {
        ...EMPTY_DECK,
        deckId: params.deckIdToEdit,
      };
      let card = {
        ...Constants.EMPTY_CARD,
        cardId: params.cardIdToEdit,
      };

      if (!LocalId.isLocalId(params.deckIdToEdit)) {
        try {
          deck = await Session.getDeckById(params.deckIdToEdit);
          if (!LocalId.isLocalId(params.cardIdToEdit)) {
            card = deck.cards.find((card) => card.cardId == params.cardIdToEdit);
            if (deck.initialCard && deck.initialCard.cardId === card.cardId) {
              card.makeInitialCard = true;
            }
          }
        } catch (e) {
          // don't suppress this error: if the provided id was an existing card id,
          // but the network requests failed, we would risk overriding the existing card
          // with a blank card unless we stop here.
          throw new Error(`Unable to fetch existing deck or card: ${e}`);
        }
      }

      // kludge: this allows us to check the screen's dirty state based on
      // the card onChange callback everywhere (even when you modify variables, a
      // property of the deck)
      card.variables = deck.variables;

      this._mounted &&
        this.setState(
          {
            deck,
            card,
            deckState: Utilities.makeInitialDeckState(card),
          },
          async () => {
            const { card } = this.state;
            GhostEvents.sendAsync('SCENE_CREATOR_EDITING', {
              isEditing: true,
            });
          }
        );
    }
  };

  // TODO: take a text actor here
  _saveAndGoToDestination = async (actorToFollow) => {
    await this._save();
    if (!this._mounted) return;
    let updatedTextActor;
    if (updatedTextActor) {
      setTimeout(() => {
        this.props.navigation.navigate('CreateDeck', {
          deckIdToEdit: this.state.deck.deckId,
          cardIdToEdit: updatedTextActor.destinationCardId,
        });
      }, 100);
    }
  };

  _handleCardChange = (changes) =>
    this.setState((state) => {
      return {
        ...state,
        card: {
          ...state.card,
          isChanged: true,
          ...changes,
        },
      };
    });

  _handleVariablesChange = (changes) => {
    this._handleCardChange({
      variables: changes,
    });
    // update deck variables state passed to scene
    this.setState((state) => {
      return {
        ...state,
        deckState: {
          variables: changes,
        },
      };
    });
  };

  _save = async () => {
    const { card, deck } = await Session.saveDeck(
      this.state.card,
      this.state.deck,
      this.state.card.variables
    );
    if (!this._mounted) return;
    return this.setState({ card, deck });
  };

  _goToDeck = (deckId = null) => {
    if (!deckId && this.state.deck) {
      deckId = this.state.deck.deckId;
    }
    if (!LocalId.isLocalId(deckId)) {
      // go to deck screen for this existing deck
      this.props.navigation.navigate('CreateDeck', {
        deckIdToEdit: deckId,
        cardIdToEdit: undefined,
      });
    } else {
      // there is no deck, go back to create index
      this.props.navigation.popToTop();
    }
  };

  _saveAndGoToDeck = async () => {
    const { card, deck } = await Session.saveDeck(
      this.state.card,
      this.state.deck,
      this.state.card.variables
    );

    if (!this._mounted) return;
    return this._goToDeck(deck.deckId);
  };

  _handleSceneScreenshot = async ({ path }) => {
    const result = await Session.apolloClient.mutate({
      mutation: gql`
        mutation UploadFile($file: Upload!) {
          uploadFile(file: $file) {
            fileId
            url
          }
        }
      `,
      variables: {
        file: new ReactNativeFile({
          uri: 'file://' + path,
          name: 'screenshot.png',
          type: 'image/png',
        }),
      },
      fetchPolicy: 'no-cache',
    });
    if (this._mounted && result && result.data && result.data.uploadFile) {
      this._handleCardChange({
        backgroundImage: result.data.uploadFile,
      });
    }
  };

  _handleSceneMessage = (message) => {
    switch (message.messageType) {
      case 'SAVE_SCENE': {
        if (this.state.card.scene && message.sceneId == this.state.card.scene.sceneId) {
          this._handleCardChange({
            changedSceneData: message.data,
          });
        }
        break;
      }
      case 'CHANGE_DECK_STATE': {
        this.setState({
          deckState: {
            ...this.state.deckState,
            ...message.data,
          },
        });
        break;
      }
    }
  };

  render() {
    const { deck, card } = this.state;
    return (
      <GhostUI.Provider>
        <CreateCardScreen
          deck={deck}
          card={card}
          goToDeck={this._goToDeck}
          saveAndGoToDeck={this._saveAndGoToDeck}
          saveAndGoToDestination={this._saveAndGoToDestination}
          onVariablesChange={this._handleVariablesChange}
          onSceneMessage={this._handleSceneMessage}
          onSceneScreenshot={this._handleSceneScreenshot}
        />
      </GhostUI.Provider>
    );
  }
}

const CreateCardScreen = ({
  card,
  deck,
  deckState,
  goToDeck,
  saveAndGoToDeck,
  saveAndGoToDestination,
  onVariablesChange,
  onSceneMessage,
  onSceneScreenshot,
}) => {
  const { showActionSheetWithOptions } = useActionSheet();

  const [selectedTab, setSelectedTab] = React.useState('card');
  React.useEffect(Keyboard.dismiss, [selectedTab]);

  const [addingBlueprint, setAddingBlueprint] = React.useState(false);

  const selectActor = React.useCallback((actorId) => {
    GhostEvents.sendAsync('SELECT_ACTOR', {
      actorId,
    });
  }, []);

  const maybeSaveAndGoToDeck = React.useCallback(async () => {
    if (card?.isChanged) {
      showActionSheetWithOptions(
        {
          title: 'Save changes?',
          options: ['Save', 'Discard', 'Cancel'],
          destructiveButtonIndex: 1,
          cancelButtonIndex: 2,
        },
        (buttonIndex) => {
          if (buttonIndex == 0) {
            return saveAndGoToDeck();
          } else if (buttonIndex == 1) {
            return goToDeck();
          }
        }
      );
    } else {
      // no changes
      return goToDeck();
    }
  }, [card?.isChanged, saveAndGoToDeck, goToDeck]);

  // estimated distance from the bottom of the scrollview to the bottom of the screen
  let containScrollViewOffset = 48;
  if (Viewport.isUltraWide && Constants.iOS) {
    containScrollViewOffset -= IPHONEX_BOTTOM_SAFE_HEIGHT;
  } else if (Constants.Android) {
    containScrollViewOffset -= ANDROID_BOTTOM_KEYBOARD_OFFSET;
  }

  const scrollViewSceneStyles = {
    backgroundColor: card.backgroundImage ? '#000' : '#f2f2f2',
  };

  // SafeAreaView doesn't respond to statusbar being hidden right now
  // https://github.com/facebook/react-native/pull/20999

  // TODO: BEN: make ScrollView move text actors when sc bottom drawers or keyboard are open
  return (
    <React.Fragment>
      <SafeAreaView style={styles.container}>
        <CardHeader
          card={card}
          isEditable
          mode={selectedTab}
          onChangeMode={setSelectedTab}
          onPressBack={maybeSaveAndGoToDeck}
        />
        <View
          style={[
            styles.cardBody,
            selectedTab === 'card' ? null : { position: 'absolute', left: -30000 },
          ]}>
          <KeyboardAwareScrollView
            enableOnAndroid={true}
            scrollEnabled={false}
            nestedScrollEnabled
            extraScrollHeight={containScrollViewOffset}
            style={styles.scrollView}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[styles.scrollViewContentContainer, scrollViewSceneStyles]}>
            <CardScene
              interactionEnabled={true}
              key={`card-scene-${card.scene && card.scene.sceneId}`}
              style={styles.scene}
              card={card}
              isEditing={true}
              deckState={deckState}
              onScreenshot={onSceneScreenshot}
              onMessage={onSceneMessage}
            />
            <CardTextPane
              card={card}
              onSelect={selectActor}
              onSelectDestination={saveAndGoToDestination}
              isEditable
            />
          </KeyboardAwareScrollView>
          <CardBottomActions
            card={card}
            onAdd={() => setAddingBlueprint(true)}
            onSave={saveAndGoToDeck}
          />
        </View>
        {selectedTab === 'variables' && (
          <DeckVariables variables={card.variables} onChange={onVariablesChange} />
        )}
      </SafeAreaView>
      <SceneCreatorPanes
        deck={deck}
        visible={selectedTab !== 'variables'}
        addingBlueprint={addingBlueprint}
        onSelectElement={() => setAddingBlueprint(false)}
      />
    </React.Fragment>
  );
};

export default withNavigationFocus(withNavigation(CreateCardScreenDataProvider));
