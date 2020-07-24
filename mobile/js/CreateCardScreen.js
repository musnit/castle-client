import React from 'react';
import gql from 'graphql-tag';
import {
  Keyboard,
  View,
  PixelRatio,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
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
import CardScene from './CardScene';
import Entypo from 'react-native-vector-icons/Entypo';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import Viewport from './viewport';

import * as GhostEvents from './ghost/GhostEvents';

import { CreateCardContext } from './scenecreator/CreateCardContext';
import { CardHeader, CARD_HEADER_HEIGHT } from './CardHeader';
import {
  DrawingCardHeader,
  DRAWING_CARD_HEADER_HEIGHT,
} from './scenecreator/drawing/DrawingCardHeader';
import { DrawingCardBottomActions, DRAWING_CARD_FOOTER_HEIGHT } from './scenecreator/drawing/DrawingCardBottomActions';
import { PopoverProvider } from './scenecreator/PopoverProvider';
import { SheetProvider } from './scenecreator/SheetProvider';
import { useGhostUI } from './ghost/GhostUI';
import {
  getInspectorBehaviors,
  getTextActorsData,
  getActiveTool,
} from './scenecreator/SceneCreatorUtilities';

const CARD_HEIGHT = (1 / Constants.CARD_RATIO) * 100 * Viewport.vw;

const CARD_BOTTOM_MIN_HEIGHT = 64;

const MAX_AVAILABLE_CARD_HEIGHT = 100 * Viewport.vh - CARD_HEADER_HEIGHT - CARD_BOTTOM_MIN_HEIGHT;
const DRAWING_MAX_AVAILABLE_CARD_HEIGHT =
  100 * Viewport.vh - DRAWING_CARD_HEADER_HEIGHT - DRAWING_CARD_FOOTER_HEIGHT;

const AUTOBACKUP_INTERVAL_MS = 2 * 60 * 1000;

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
  card: {
    borderRadius: Constants.CARD_BORDER_RADIUS,
    aspectRatio: Constants.CARD_RATIO,
    width: '100%',
    overflow: 'hidden',
  },
  scene: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  textActorsContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  actions: {
    width: '100%',
    paddingHorizontal: 8,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    minHeight: CARD_BOTTOM_MIN_HEIGHT,
  },
});

const CardBottomActions = ({
  card,
  onAdd,
  onOpenLayout,
  onSave,
  isPlayingScene,
  isSceneLoaded,
}) => {
  if (isPlayingScene || !isSceneLoaded) {
    return null;
  }
  return (
    <View style={styles.actions}>
      <TouchableOpacity style={Constants.styles.primaryButton} onPress={onAdd}>
        <MCIcon
          name="shape-polygon-plus"
          size={22}
          color="#000"
          style={Constants.styles.primaryButtonIconLeft}
        />
        <Text style={Constants.styles.primaryButtonLabel}>Add</Text>
      </TouchableOpacity>
      <TouchableOpacity style={Constants.styles.secondaryButton} onPress={onOpenLayout}>
        <Icon
          name="grid-on"
          size={22}
          color="#fff"
          style={Constants.styles.secondaryButtonIconLeft}
        />
        <Text style={Constants.styles.secondaryButtonLabel}>Layout</Text>
      </TouchableOpacity>
      <TouchableOpacity style={Constants.styles.primaryButton} onPress={onSave}>
        <Text style={Constants.styles.primaryButtonLabel}>Done</Text>
        <MCIcon
          name="arrow-right"
          size={22}
          color="#000"
          style={Constants.styles.primaryButtonIconRight}
        />
      </TouchableOpacity>
    </View>
  );
};

const EMPTY_DECK = {
  title: '',
  cards: [],
  variables: [],
};

// TODO: find a cleaner way to get these
const getLibraryEntries = (root) => {
  const element = root?.panes ? root.panes['sceneCreatorBlueprints'] : null;
  if (!element) return null;

  let blueprintsData;
  if (element.children.count) {
    Object.entries(element.children).forEach(([key, child]) => {
      if (child.type === 'data') {
        blueprintsData = child.props.data;
      }
    });
  }

  return blueprintsData?.library;
};

class CreateCardScreenDataProvider extends React.Component {
  state = {
    deck: EMPTY_DECK,
    card: Constants.EMPTY_CARD,
    deckState: { variables: [] },
    loading: false,
  };

  componentDidMount() {
    this._mounted = true;
    this._update(null, this.props);
  }

  componentDidUpdate(prevProps, prevState) {
    this._update(prevProps, this.props);
  }

  componentWillUnmount() {
    if (this._backupInterval) {
      clearInterval(this._backupInterval);
      this._backupInterval = null;
    }
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

      if (!card.scene) {
        card.scene = Constants.EMPTY_CARD.scene;
      }

      if (this._mounted) {
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
        this._backupInterval = setInterval(this._saveBackup, AUTOBACKUP_INTERVAL_MS);
      }
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

  _saveBackup = () =>
    Session.saveDeck(this.state.card, this.state.deck, this.state.card.variables, true);

  _save = async () => {
    await this.setState({ loading: true });
    const { card, deck } = await Session.saveDeck(
      this.state.card,
      this.state.deck,
      this.state.card.variables
    );
    if (!this._mounted) return;
    return this.setState({ card, deck, loading: false });
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
    await this.setState({ loading: true });
    const { card, deck } = await Session.saveDeck(
      this.state.card,
      this.state.deck,
      this.state.card.variables
    );

    if (!this._mounted) return;
    this.setState({ loading: false });
    return this._goToDeck(deck.deckId);
  };

  _goToCard = (nextCard) => {
    setTimeout(() => {
      this.props.navigation.navigate('CreateDeck', {
        deckIdToEdit: this.state.deck.deckId,
        cardIdToEdit: nextCard.cardId,
      });
    }, 100);
  };

  _saveAndGoToCard = async (nextCard) => {
    await this._save();
    if (!this._mounted) return;
    this._goToCard(nextCard);
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
      case 'UPDATE_SCENE': {
        this._handleCardChange({
          changedSceneData: message.data,
        });
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

  _handleSceneRevertData = (data) => {
    // data is a JS object with a `snapshot` key at the top level
    GhostEvents.sendAsync('LOAD_SNAPSHOT', {
      data,
    });
  };

  _resetDeckState = () =>
    this.setState((state) => {
      return {
        ...state,
        deckState: Utilities.makeInitialDeckState(state.card),
      };
    });

  render() {
    const { deck, card, deckState, loading } = this.state;
    return (
      <GhostUI.Provider>
        <CreateCardScreen
          deck={deck}
          card={card}
          loading={loading}
          deckState={deckState}
          resetDeckState={this._resetDeckState}
          goToDeck={this._goToDeck}
          goToCard={this._goToCard}
          saveAndGoToDeck={this._saveAndGoToDeck}
          saveAndGoToCard={this._saveAndGoToCard}
          onVariablesChange={this._handleVariablesChange}
          onSceneMessage={this._handleSceneMessage}
          onSceneRevertData={this._handleSceneRevertData}
          onSceneScreenshot={this._handleSceneScreenshot}
        />
      </GhostUI.Provider>
    );
  }
}

const CreateCardScreen = ({
  card,
  deck,
  loading,
  deckState,
  resetDeckState,
  goToDeck,
  goToCard,
  saveAndGoToDeck,
  saveAndGoToCard,
  onVariablesChange,
  onSceneMessage,
  onSceneScreenshot,
  onSceneRevertData,
}) => {
  const { showActionSheetWithOptions } = useActionSheet();
  const { root, globalActions, sendGlobalAction, transformAssetUri } = useGhostUI();

  const [activeSheet, setActiveSheet] = React.useState(null);
  React.useEffect(Keyboard.dismiss, [activeSheet]);

  const [isShowingTextActors, setShowingTextActors] = React.useState(true);
  const [isShowingDraw, setIsShowingDraw] = React.useState(false);

  const isSceneLoaded = !!globalActions;
  const isPlaying = globalActions?.performing;
  const selectedActorId = globalActions?.selectedActorId;
  const hasSelection = selectedActorId !== undefined;
  const { behaviors, behaviorActions } = getInspectorBehaviors(root);
  const { activeToolData, activeToolAction } = getActiveTool(root);
  const { textActors, isTextActorSelected } = getTextActorsData(root, isPlaying);

  // lua's behaviors can be "tools"
  React.useEffect(() => {
    if (globalActions?.activeToolBehaviorId) {
      const activeToolBehavior = globalActions.tools.find(
        (behavior) => behavior.behaviorId === globalActions.activeToolBehaviorId
      );
      if (activeToolBehavior && activeToolBehavior.name == 'Draw2') {
        setIsShowingDraw(true);
      } else {
        setIsShowingDraw(false);
      }
    }
  }, [globalActions?.activeToolBehaviorId]);

  React.useEffect(() => {
    if (hasSelection) {
      // when going from no selection to selection, close any other sheets
      setActiveSheet(null);
    }
  }, [hasSelection]);

  React.useEffect(resetDeckState, [isPlaying]);

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

  const maybeSaveAndGoToCard = React.useCallback(
    async (nextCard) => {
      if (card?.isChanged) {
        const title = Utilities.makeCardPreviewTitle(nextCard, deck);
        showActionSheetWithOptions(
          {
            title: `Save changes and go to '${title}?'`,
            options: ['Save and go', 'Cancel'],
            cancelButtonIndex: 1,
          },
          (buttonIndex) => {
            if (buttonIndex == 0) {
              return saveAndGoToCard(nextCard);
            }
          }
        );
      } else {
        // no changes
        return goToCard(nextCard);
      }
    },
    [card?.isChanged, saveAndGoToCard, goToCard]
  );

  const onSelectBackupData = React.useCallback(
    (data) => {
      setActiveSheet(null);
      onSceneRevertData(data);
    },
    [onSceneRevertData, setActiveSheet]
  );

  GhostEvents.useListen({
    eventName: 'NAVIGATE_TO_CARD',
    handler: ({ card }) => maybeSaveAndGoToCard(card),
  });

  if (Constants.Android) {
    // after the game loads, it listens for keyboard events and
    // causes react native's back button event to fail
    GhostEvents.useListen({
      eventName: 'CASTLE_SYSTEM_BACK_BUTTON',
      handler: maybeSaveAndGoToDeck,
    });
  }

  const cardBackgroundStyles = {
    backgroundColor: card.backgroundImage ? '#000' : '#f2f2f2',
    justifyContent: isTextActorSelected ? 'flex-start' : 'flex-end',
  };

  let cardFitStyles = null;
  if (isShowingDraw) {
    if (Viewport.vw * 100 / DRAWING_MAX_AVAILABLE_CARD_HEIGHT > .91) {
      cardFitStyles = { aspectRatio: .91, width: undefined, height: DRAWING_MAX_AVAILABLE_CARD_HEIGHT };
    } else {
      cardFitStyles = { aspectRatio: .91 };
    }
  } else {
    if (Viewport.vw * 100 / MAX_AVAILABLE_CARD_HEIGHT > Constants.CARD_RATIO) {
      cardFitStyles = { width: undefined, height: MAX_AVAILABLE_CARD_HEIGHT };
    }
  }

  const contextValue = {
    deck,
    card,
    isPlaying,
    selectedActorId,
    hasSelection,
    isTextActorSelected,
    behaviors,
    behaviorActions,
    library: getLibraryEntries(root),
    transformAssetUri,
    onSelectBackupData,
    isShowingTextActors,
    setShowingTextActors,
    variables: card.variables,
    onVariablesChange,
    activeToolData,
    activeToolAction,
  };

  // SafeAreaView doesn't respond to statusbar being hidden right now
  // https://github.com/facebook/react-native/pull/20999
  return (
    <CreateCardContext.Provider value={contextValue}>
      <PopoverProvider>
      <SafeAreaView style={styles.container}>
        {isShowingDraw ? (
          <DrawingCardHeader onPressBack={() => sendGlobalAction('resetActiveTool')} />
        ) : (
          <CardHeader
            card={card}
            isEditable
            mode={activeSheet}
            onChangeMode={setActiveSheet}
            onPressBack={maybeSaveAndGoToDeck}
          />
        )}
        <View style={styles.cardBody}>
          <View
            style={[
              styles.card,
              cardBackgroundStyles,
              cardFitStyles,
            ]}>
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
            <View style={styles.textActorsContainer}>
              <CardText
                disabled={loading}
                visible={isShowingTextActors || isPlaying}
                textActors={textActors}
                card={card}
                onSelect={selectActor}
                isEditable={!isPlaying}
              />
            </View>
          </View>
          {isShowingDraw ? (
              <DrawingCardBottomActions />
          ) : (
            <CardBottomActions
              card={card}
              onAdd={() => setActiveSheet('sceneCreatorBlueprints')}
              onOpenLayout={() => setActiveSheet('layout')}
              onSave={saveAndGoToDeck}
              isSceneLoaded={isSceneLoaded}
              isPlayingScene={isPlaying}
            />
          )}
        </View>
      </SafeAreaView>
        <SheetProvider
          activeSheet={activeSheet}
          setActiveSheet={setActiveSheet}
          isShowingDraw={isShowingDraw}
        />
      </PopoverProvider>
    </CreateCardContext.Provider>
  );
};

export default withNavigationFocus(withNavigation(CreateCardScreenDataProvider));
