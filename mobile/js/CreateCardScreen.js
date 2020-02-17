import React from 'react';
import gql from 'graphql-tag';
import { View, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import SafeAreaView from 'react-native-safe-area-view';
import { connectActionSheet } from '@expo/react-native-action-sheet';
import { ReactNativeFile } from 'apollo-upload-client';

import uuid from 'uuid/v4';
import { withNavigation, withNavigationFocus } from 'react-navigation';

import * as Session from './Session';
import * as Utilities from './utilities';
import * as Constants from './Constants';

import CardBlocks from './CardBlocks';
import CardDestinationPickerSheet from './CardDestinationPickerSheet';
import CardHeader from './CardHeader';
import CardScene from './CardScene';
import Viewport from './viewport';

import * as GhostEvents from './ghost/GhostEvents';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cardBody: {
    // contains just the 16:9 card as a child
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    aspectRatio: 0.5625, // 16:9
    borderRadius: 6,
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
  sceneActionsContainer: {
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
  description: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  actions: {
    width: '100%',
    paddingHorizontal: 12,
    paddingBottom: 12,
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

const EMPTY_DECK = {
  title: '',
  cards: [],
};

const EMPTY_CARD = {
  title: '',
  blocks: [],
};

const EMPTY_BLOCK = {
  title: null,
  type: 'text',
  destination: null,
};

// height of safe area + tab bar on iPhone X family
const IPHONEX_BOTTOM_SAFE_HEIGHT = 83 + 33;

// NOTE (ben): this screen is currently not a function component
// because of some of the cases where it needs to perform multiple
// stateful things in sequence, and useEffect() was less intuitive for this.
// the best example is _saveAndGoToDestination, where we
// publish a card (containing some temp uuid blocks), find the resulting block after
// publish, then immediately navigate to a new card based on the block's destination.
// this could be maybe be solved by moving the publish network call ownership into a HOC.
class CreateCardScreen extends React.Component {
  _destinationPickerRef = React.createRef();

  state = {
    deck: EMPTY_DECK,
    card: EMPTY_CARD,
    isEditingBlock: false,
    blockIdToEdit: null,
    isHeaderExpanded: false,
    isEditingScene: false,
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
      prevProps && prevProps.navigation.state.params
        ? prevProps.navigation.state.params.deckIdToEdit
        : undefined;
    const prevCardIdToEdit =
      prevProps && prevProps.navigation.state.params
        ? prevProps.navigation.state.params.cardIdToEdit
        : undefined;
    const params = props.navigation.state.params || {};
    if (
      !prevProps ||
      prevDeckIdToEdit !== params.deckIdToEdit ||
      prevCardIdToEdit !== params.cardIdToEdit ||
      (props.isFocused && !prevProps.isFocused)
    ) {
      let deck = EMPTY_DECK,
        card = EMPTY_CARD;
      if (params.deckIdToEdit) {
        try {
          deck = await Session.getDeckById(params.deckIdToEdit);
          card = deck.cards.find((card) => card.cardId == params.cardIdToEdit);
          if (card) {
            if (deck.initialCard && deck.initialCard.cardId === card.cardId) {
              card.makeInitialCard = true;
            }
          } else {
            // possible to specify a deck id but no card
            card = EMPTY_CARD;
          }
        } catch (_) {}
      }
      this._mounted && this.setState({ deck, card });
    }
  };

  _saveAndGoToDestination = async (blockToFollow) => {
    // flag this block so we can follow it after saving
    const cardBlockUpdateId = uuid();
    await this._handleBlockChange({
      ...blockToFollow,
      cardBlockUpdateId,
    });
    await this._save();
    if (!this._mounted) return;
    const updatedBlock = this.state.card.blocks.find(
      (block) => block.cardBlockUpdateId === cardBlockUpdateId
    );
    if (updatedBlock && updatedBlock.destinationCardId) {
      setTimeout(() => {
        this.props.navigation.navigate('CreateCard', {
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

  _handleDismissDestinationPicker = () => {
    if (this._destinationPickerRef) {
      this._destinationPickerRef.current.close();
    }
  };

  _handleBlockTextInputFocus = () => {};

  _handleCardChange = (changes) => {
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
  };

  _save = async () => {
    await this._handleDismissEditing();
    const { card, deck } = await Session.saveDeck(this.state.card, this.state.deck);
    if (!this._mounted) return;
    return this.setState({ card, deck });
  };

  _goToDeck = (deckId = null) => {
    if (!deckId && this.state.deck) {
      deckId = this.state.deck.deckId;
    }
    if (deckId) {
      // go to deck screen for this existing deck
      this.props.navigation.navigate('CreateDeck', { deckIdToEdit: deckId });
    } else {
      // there is no deck, go back to create index
      const createNavigator = this.props.navigation.dangerouslyGetParent();
      if (createNavigator) {
        createNavigator.popToTop();
      }
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
    const { card, deck } = await Session.saveDeck(this.state.card, this.state.deck);
    if (!this._mounted) return;
    return this._goToDeck(deck.deckId);
  };

  _showDestinationPicker = () => {
    if (this._destinationPickerRef) {
      this._destinationPickerRef.current.open();
    }
  };

  _onPickDestinationCard = (block, card) => {
    if (card && card.cardId) {
      this._handleBlockChange({ ...block, destinationCardId: card.cardId });
    } else {
      this._handleBlockChange({ ...block, createDestinationCard: true });
    }
    this._handleDismissDestinationPicker();
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
    } else if (this.state.isHeaderExpanded) {
      this.setState({ isHeaderExpanded: false });
    }
  };

  _handleChooseImage = () => {
    Utilities.launchImageLibrary((result) => {
      if (!result || result.error) {
        this._handleCardChange({
          backgroundImage: null,
        });
      } else if (result.url) {
        this._handleCardChange({
          backgroundImage: result,
        });
      }
    });
  };

  _handleEditScene = async () => {
    // Set scene editing state
    this.setState({ isEditingScene: true }, async () => {
      const { card } = this.state;
      if (this.state.card.scene) {
        // Already have a scene, just notify Lua
        GhostEvents.sendAsync('SCENE_CREATOR_EDITING', {
          isEditing: true,
        });
      } else {
        // No scene, add one
        const newSceneData = { empty: true };
        const result = await Session.apolloClient.mutate({
          mutation: gql`
            mutation CreateScene($data: Json!) {
              createScene(data: $data) {
                sceneId
              }
            }
          `,
          variables: {
            data: newSceneData,
          },
        });
        sceneId = result.data && result.data.createScene && result.data.createScene.sceneId;
        if (sceneId) {
          this._handleCardChange({ scene: { sceneId, data: newSceneData } });
        }
      }
    });
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

  _toggleHeaderExpanded = () =>
    this.setState((state) => {
      return { ...state, isHeaderExpanded: !state.isHeaderExpanded };
    });

  render() {
    const {
      deck,
      card,
      isEditingBlock,
      blockIdToEdit,
      isHeaderExpanded,
      isEditingScene,
    } = this.state;
    const blockToEdit =
      isEditingBlock && blockIdToEdit
        ? card.blocks.find((block) => block.cardBlockId === blockIdToEdit)
        : EMPTY_BLOCK;

    const chooseImageAction = card.backgroundImage ? 'Change Image' : 'Add Image';
    const editSceneAction = card.scene ? 'Edit Scene' : 'Add Scene';
    const containScrollViewStyles = Viewport.isUltraWide ? { width: '100%' } : { height: '100%' };
    const containScrollViewOffset = Viewport.isUltraWide ? -IPHONEX_BOTTOM_SAFE_HEIGHT : 0;
    const scrollViewSceneStyles = card.backgroundImage
      ? { backgroundColor: '#000' }
      : { backgroundColor: '#f2f2f2' };

    const editBlockProps = isEditingBlock
      ? {
          deck,
          isEditingBlock,
          blockToEdit,
          onTextInputFocus: this._handleBlockTextInputFocus,
          onChangeBlock: this._handleBlockChange,
          onSelectPickDestination: this._showDestinationPicker,
          onSelectDestination: this._onPickDestinationCard,
          onGoToDestination: () => this._saveAndGoToDestination(blockToEdit),
        }
      : null;

    // SafeAreaView doesn't respond to statusbar being hidden right now
    // https://github.com/facebook/react-native/pull/20999
    return (
      <React.Fragment>
        <SafeAreaView style={styles.container}>
          {!isEditingScene ? (
            <CardHeader
              card={card}
              expanded={isHeaderExpanded}
              onPressBack={this._maybeSaveAndGoToDeck}
              onPressTitle={this._toggleHeaderExpanded}
              onChange={this._handleCardChange}
            />
          ) : null}
          <View style={[styles.cardBody, isEditingScene ? { flex: 1 } : {}]}>
            <KeyboardAwareScrollView
              scrollEnabled={!isEditingScene}
              nestedScrollEnabled
              extraScrollHeight={containScrollViewOffset}
              style={[
                styles.scrollView,
                containScrollViewStyles,
                isEditingScene ? { flex: 1, aspectRatio: null, borderRadius: null } : {},
              ]}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={[styles.scrollViewContentContainer, scrollViewSceneStyles]}
              innerRef={(ref) => (this._scrollViewRef = ref)}>
              <CardScene
                key={`card-scene-${card.scene && card.scene.sceneId}`}
                style={styles.scene}
                card={card}
                isEditing={isEditingScene}
                onEndEditing={this._handleEndEditScene}
                onScreenshot={this._handleSceneScreenshot}
              />
              {!isEditingScene ? (
                <React.Fragment>
                  <TouchableWithoutFeedback onPress={this._handlePressBackground}>
                    <View style={styles.sceneActionsContainer}>
                      <View style={styles.sceneActions}>
                        <PlainButton onPress={this._handleChooseImage}>
                          {chooseImageAction}
                        </PlainButton>
                        <PlainButton style={{ marginLeft: 8 }} onPress={this._handleEditScene}>
                          {editSceneAction}
                        </PlainButton>
                      </View>
                    </View>
                  </TouchableWithoutFeedback>
                  <View style={styles.description}>
                    <CardBlocks
                      card={card}
                      onSelectBlock={this._handleEditBlock}
                      onSelectDestination={this._saveAndGoToDestination}
                      isEditable
                      editBlockProps={editBlockProps}
                    />
                  </View>
                  <View style={styles.actions}>
                    <PlainButton onPress={() => this._handleEditBlock(null)}>
                      Add Block
                    </PlainButton>
                    <PrimaryButton onPress={this._saveAndGoToDeck}>Done</PrimaryButton>
                  </View>
                </React.Fragment>
              ) : null}
            </KeyboardAwareScrollView>
          </View>
        </SafeAreaView>
        <CardDestinationPickerSheet
          deck={deck}
          ref={this._destinationPickerRef}
          onSelectCard={(card) => this._onPickDestinationCard(blockToEdit, card)}
        />
      </React.Fragment>
    );
  }
}

export default connectActionSheet(withNavigationFocus(withNavigation(CreateCardScreen)));
