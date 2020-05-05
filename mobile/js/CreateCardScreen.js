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
import { connectActionSheet } from '@expo/react-native-action-sheet';
import { ReactNativeFile } from 'apollo-upload-client';
import { useGhostEvents } from './ghost/GhostEvents';
import * as GhostUI from './ghost/GhostUI';

import uuid from 'uuid/v4';
import { withNavigation, withNavigationFocus } from '@react-navigation/compat';

import * as Constants from './Constants';
import * as LocalId from './local-id';
import * as Session from './Session';
import * as Utilities from './utilities';

import CardBlocks from './CardBlocks';
import CardHeader from './CardHeader';
import CardScene from './CardScene';
import DeckVariables from './DeckVariables';
import SceneCreatorForegroundActions from './scenecreator/SceneCreatorForegroundActions';
import SceneCreatorPanes from './scenecreator/SceneCreatorPanes';
import Viewport from './viewport';

import * as GhostEvents from './ghost/GhostEvents';

const CARD_HEIGHT = (1 / Constants.CARD_RATIO) * 100 * Viewport.vw;

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
  button: {
    ...Constants.styles.plainButton,
    ...Constants.styles.dropShadow,
  },
  buttonLabel: {
    ...Constants.styles.plainButtonLabel,
  },
  primaryButton: {
    ...Constants.styles.primaryButton,
    ...Constants.styles.dropShadow,
  },
  primaryButtonLabel: {
    ...Constants.styles.primaryButtonLabel,
  },
  blocksContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  actions: {
    width: '100%',
    paddingHorizontal: 2,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

const PlainButton = ({ style, ...props }) => {
  const buttonProps = { ...props, children: undefined };
  return (
    <TouchableOpacity style={[styles.button, style]} {...buttonProps}>
      <Text style={styles.buttonLabel}>{props.children}</Text>
    </TouchableOpacity>
  );
};

const PrimaryButton = ({ style, ...props }) => {
  const buttonProps = { ...props, children: undefined };
  return (
    <TouchableOpacity style={[styles.primaryButton, style]} {...buttonProps}>
      <Text style={styles.primaryButtonLabel}>{props.children}</Text>
    </TouchableOpacity>
  );
};

const CardForegroundActions = (props) => {
  const { card, editBlockProps } = props;
  const { onPressBackground, onEditBlock, onPickDestination } = props;
  const { isEditingScene } = props;
  const blocks = (
    <CardBlocks
      card={card}
      onSelectBlock={onEditBlock}
      onSelectDestination={onPickDestination}
      isEditable
      editBlockProps={editBlockProps}
    />
  );
  if (isEditingScene) {
    // scene creator back, play, undo
    // TODO: proper styling
    return (
      <React.Fragment>
        <SceneCreatorForegroundActions />
        <View style={{ marginTop: 64 }}>{blocks}</View>
      </React.Fragment>
    );
  } else {
    // card blocks and background
    return (
      <React.Fragment>
        <TouchableWithoutFeedback onPress={onPressBackground}>
          <View
            style={styles.cardBackgroundContainer}
            pointerEvents={editBlockProps?.isEditingBlock ? 'auto' : 'none'}
          />
        </TouchableWithoutFeedback>
        <View style={styles.blocksContainer}>{blocks}</View>
      </React.Fragment>
    );
  }
};

const CardBottomActions = ({ card, onEditScene, onEditBlock, onSave }) => {
  const editSceneAction = card.scene ? 'Edit Scene' : 'Add Scene';
  return (
    <View style={styles.actions}>
      <View style={{ flexDirection: 'row' }}>
        <PlainButton onPress={() => onEditBlock(null)}>Add Block</PlainButton>
        <PlainButton style={{ marginLeft: 8 }} onPress={onEditScene}>
          {editSceneAction}
        </PlainButton>
      </View>
      <PrimaryButton onPress={onSave} style={{ borderColor: '#fff', borderWidth: 1 }}>
        Done
      </PrimaryButton>
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

// NOTE (ben): this screen is currently not a function component
// because of some of the cases where it needs to perform multiple
// stateful things in sequence, and useEffect() was less intuitive for this.
// the best example is _saveAndGoToDestination, where we
// publish a card (containing some temp uuid blocks), find the resulting block after
// publish, then immediately navigate to a new card based on the block's destination.
// this could be maybe be solved by moving the publish network call ownership into a HOC.
class CreateCardScreen extends React.Component {
  state = {
    deck: EMPTY_DECK,
    card: Constants.EMPTY_CARD,
    isEditingBlock: false,
    blockIdToEdit: null,
    selectedTab: 'card',
    isEditingScene: false,
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
    const prevIsEditingScene =
      prevProps && prevProps.route.params ? prevProps.route.params.isEditingScene : undefined;
    const params = props.route.params || {};
    if (
      !prevProps ||
      prevDeckIdToEdit !== params.deckIdToEdit ||
      prevCardIdToEdit !== params.cardIdToEdit ||
      prevIsEditingScene !== params.isEditingScene ||
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
      let isEditingScene = !!params.isEditingScene;

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
        this.setState({
          deck,
          card,
          isEditingScene,
          deckState: Utilities.makeInitialDeckState(card),
        });
    }
  };

  _saveAndGoToDestination = async (blockToFollow) => {
    await this._handleBlockChange({
      ...blockToFollow,
    });
    await this._save();
    if (!this._mounted) return;
    const updatedBlock = this.state.card.blocks.find(
      (block) => block.destinationCardId === blockToFollow.destinationCardId
    );
    if (updatedBlock) {
      setTimeout(() => {
        this.props.navigation.navigate('CreateDeck', {
          deckIdToEdit: this.state.deck.deckId,
          cardIdToEdit: updatedBlock.destinationCardId,
        });
      }, 100);
    }
  };

  _handleEditBlock = (blockIdToEdit) => {
    if (!blockIdToEdit) {
      // create a stub block with a new id.
      // the block will get auto-deleted if the user blurs
      // without typing anything into the empty block
      blockIdToEdit = String(uuid());
      this.setState((state) => {
        const blocks = [...state.card.blocks];
        blocks.push({ ...EMPTY_BLOCK, cardBlockId: blockIdToEdit });
        return {
          ...state,
          blockIdToEdit,
          isEditingBlock: true,
          card: {
            ...state.card,
            blocks,
          },
        };
      });
    } else {
      this.setState({ isEditingBlock: true, blockIdToEdit });
    }
  };

  _handleDismissEditing = () => {
    return this.setState((state) => {
      // making a block empty is the same as deleting it
      const blocks = state.card.blocks.filter((block) => block.title && block.title.length > 0);
      return {
        ...state,
        isEditingBlock: false,
        blockToEdit: null,
        card: {
          ...state.card,
          blocks,
        },
      };
    });
  };

  _handleBlockTextInputFocus = () => {};

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
    await this._handleDismissEditing();
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

  _maybeSaveAndGoToDeck = async () => {
    const { showActionSheetWithOptions } = this.props;
    if (this.state.card && this.state.card.isChanged) {
      showActionSheetWithOptions(
        {
          title: 'Save changes?',
          options: ['Save', 'Discard', 'Cancel'],
          destructiveButtonIndex: 1,
          cancelButtonIndex: 2,
        },
        (buttonIndex) => {
          if (buttonIndex == 0) {
            return this._saveAndGoToDeck();
          } else if (buttonIndex == 1) {
            return this._goToDeck();
          }
        }
      );
    } else {
      // no changes
      return this._goToDeck();
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

  _handleBlockChange = (block) => {
    return this.setState((state) => {
      const blocks = [...state.card.blocks];
      let existingIndex = -1;
      let blockIdToEdit = state.blockIdToEdit;
      if (block.cardBlockId) {
        existingIndex = blocks.findIndex((existing) => existing.cardBlockId === block.cardBlockId);
      }
      if (existingIndex >= 0) {
        blocks[existingIndex] = block;
      } else {
        // we don't want to auto-create the block here
        // because the block id determines the key of the focused text input,
        // and changing the focused text input causes keyboard thrash.
        throw new Error(`Tried to change a nonexistent block`);
      }
      return {
        ...state,
        blockIdToEdit,
        card: {
          ...state.card,
          isChanged: true,
          blocks,
        },
      };
    });
  };

  _handlePressBackground = () => {
    if (this.state.isEditingBlock) {
      this._handleDismissEditing();
    }
  };

  _handleEditScene = async () => {
    // Set scene editing state
    this.setState(
      {
        isEditingScene: true,
        // reset deck state every time we enter the scene
        deckState: Utilities.makeInitialDeckState(this.state.card),
      },
      async () => {
        const { card } = this.state;
        if (card.scene) {
          // Already have a scene, just notify Lua
          GhostEvents.sendAsync('SCENE_CREATOR_EDITING', {
            isEditing: true,
          });
        } else {
          // No scene, add one
          this._handleCardChange({
            scene: { sceneId: card.cardId + 1000000, data: { empty: true } },
          });
        }
      }
    );
  };

  _handleEndEditScene = () => {
    // Unset scene editing state and notify Lua
    this.setState({ isEditingScene: false }, () => {
      GhostEvents.sendAsync('SCENE_CREATOR_EDITING', {
        isEditing: false,
      });
    });
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
    if (result && result.data && result.data.uploadFile) {
      this._handleCardChange({
        backgroundImage: result.data.uploadFile,
      });
    }
  };

  _handleSceneMessage = (message) => {
    switch (message.messageType) {
      case 'SAVE_SCENE': {
        /*console.log(
          'SAVE_SCENE sceneid: ' +
            message.sceneId +
            '   data length: ' +
            JSON.stringify(message.data).length
        );*/

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

  _onSelectTab = (selectedTab) => this.setState({ selectedTab }, Keyboard.dismiss);

  render() {
    const { deck, card, isEditingBlock, blockIdToEdit, isEditingScene, selectedTab } = this.state;
    const blockToEdit =
      isEditingBlock && blockIdToEdit
        ? card.blocks.find((block) => block.cardBlockId === blockIdToEdit)
        : EMPTY_BLOCK;

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

    const editBlockProps = isEditingBlock
      ? {
          deck,
          isEditingBlock,
          blockToEdit,
          variables: card.variables,
          onTextInputFocus: this._handleBlockTextInputFocus,
          onChangeBlock: this._handleBlockChange,
          onSelectPickDestination: () => {}, // TODO: BEN: remove
          onSelectDestination: this._onPickDestinationCard,
          onGoToDestination: () => this._saveAndGoToDestination(blockToEdit),
        }
      : null;

    // SafeAreaView doesn't respond to statusbar being hidden right now
    // https://github.com/facebook/react-native/pull/20999
    return (
      <GhostUI.Provider>
        <SafeAreaView style={styles.container}>
          <CardHeader
            card={card}
            isEditable
            mode={selectedTab}
            onChangeMode={this._onSelectTab}
            onPressBack={this._maybeSaveAndGoToDeck}
          />
          <View
            style={[
              styles.cardBody,
              selectedTab === 'card' ? null : { position: 'absolute', left: -30000 },
            ]}>
            <KeyboardAwareScrollView
              enableOnAndroid={true}
              scrollEnabled={isEditingBlock}
              nestedScrollEnabled
              extraScrollHeight={containScrollViewOffset}
              style={styles.scrollView}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={[styles.scrollViewContentContainer, scrollViewSceneStyles]}
              innerRef={(ref) => (this._scrollViewRef = ref)}>
              <CardScene
                interactionEnabled={true}
                key={`card-scene-${card.scene && card.scene.sceneId}`}
                style={styles.scene}
                card={card}
                isEditing={isEditingScene}
                deckState={this.state.deckState}
                onEndEditing={this._handleEndEditScene}
                onScreenshot={this._handleSceneScreenshot}
                onMessage={this._handleSceneMessage}
              />
              <CardForegroundActions
                card={card}
                isEditingScene={isEditingScene}
                onPressBackground={this._handlePressBackground}
                onEditBlock={this._handleEditBlock}
                onPickDestination={this._saveAndGoToDestination}
                editBlockProps={editBlockProps}
              />
            </KeyboardAwareScrollView>
            {!isEditingScene ? (
              <CardBottomActions
                card={card}
                onEditScene={this._handleEditScene}
                onEditBlock={this._handleEditBlock}
                onSave={this._saveAndGoToDeck}
              />
            ) : null}
          </View>
          {selectedTab === 'variables' && (
            <DeckVariables variables={card.variables} onChange={this._handleVariablesChange} />
          )}
        </SafeAreaView>
        <SceneCreatorPanes
          deck={deck}
          visible={isEditingScene && selectedTab !== 'variables'}
          landscape={false}
        />
      </GhostUI.Provider>
    );
  }
}

export default connectActionSheet(withNavigationFocus(withNavigation(CreateCardScreen)));
