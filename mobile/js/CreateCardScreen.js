import React from 'react';
import gql from 'graphql-tag';
import { View, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import SafeAreaView from 'react-native-safe-area-view';
import { connectActionSheet } from '@expo/react-native-action-sheet';

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
  sceneActions: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexShrink: 1,
  },
  button: {
    ...Constants.styles.overlayButton,
  },
  buttonLabel: {
    ...Constants.styles.overlayButtonLabel,
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

const CARD_FRAGMENT = `
  id
  cardId
  title
  backgroundImage {
    fileId
    url
  }
  sceneId
  blocks {
    id
    cardBlockId
    cardBlockUpdateId
    type
    title
    destinationCardId
  }
`;

const saveDeck = async (card, deck) => {
  const deckUpdateFragment = {
    title: deck.title,
  };
  const cardUpdateFragment = {
    title: card.title,
    backgroundImageFileId: card.backgroundImage ? card.backgroundImage.fileId : undefined,
    blocks: card.blocks.map((block) => {
      return {
        type: block.type,
        destinationCardId: block.destinationCardId,
        title: block.title,
        createDestinationCard: block.createDestinationCard,
        cardBlockUpdateId: block.cardBlockUpdateId,
      };
    }),
    makeInitialCard: card.makeInitialCard || undefined,
  };
  if (deck.deckId && card.cardId) {
    // update existing card in deck
    const result = await Session.apolloClient.mutate({
      mutation: gql`
        mutation UpdateCard($cardId: ID!, $card: CardInput!) {
          updateCard(
            cardId: $cardId,
            card: $card
          ) {
            ${CARD_FRAGMENT}
          }
        }
      `,
      variables: { cardId: card.cardId, card: cardUpdateFragment },
    });
    let updatedCard,
      newCards = [...deck.cards];
    result.data.updateCard.forEach((updated) => {
      let existingIndex = deck.cards.findIndex((old) => old.cardId === updated.cardId);
      if (existingIndex > 0) {
        newCards[existingIndex] = updated;
      } else {
        newCards.push(updated);
      }
      if (updated.cardId === card.cardId) {
        updatedCard = updated;
      }
    });
    return {
      card: updatedCard,
      deck: {
        ...deck,
        cards: newCards,
      },
    };
  } else if (deck.deckId) {
    // TODO: add a card to an existing deck
  } else {
    // no existing deckId or cardId, so create a new deck
    // and add the card to it.
    const result = await Session.apolloClient.mutate({
      mutation: gql`
        mutation CreateDeck($deck: DeckInput!, $card: CardInput!) {
          createDeck(
            deck: $deck,
            card: $card
          ) {
            id
            deckId
            title
            cards {
              ${CARD_FRAGMENT}
            }
            initialCard { cardId }
          }
        }
      `,
      variables: { deck: deckUpdateFragment, card: cardUpdateFragment },
    });
    let newCard;
    if (result.data.createDeck.cards.length > 1) {
      // if the initial card contained references to other cards,
      // we can get many cards back here. we care about the non-empty one
      newCard = result.data.createDeck.cards.find((card) => card.blocks && card.blocks.length > 0);
    } else {
      newCard = result.data.createDeck.cards[0];
    }
    return {
      card: newCard,
      deck: result.data.createDeck,
    };
  }
};

const getDeckById = async (deckId) => {
  const result = await Session.apolloClient.query({
    query: gql`
      query GetDeckById($deckId: ID!) {
        deck(deckId: $deckId) {
          id
          deckId
          title
          cards {
            ${CARD_FRAGMENT}
          }
          initialCard { cardId }
        }
      }
    `,
    variables: { deckId },
    fetchPolicy: 'no-cache',
  });
  return result.data.deck;
};

const deleteCard = async (cardId) => {
  return Session.apolloClient.mutate({
    mutation: gql`
      mutation DeleteCard($cardId: ID!) {
        deleteCard(cardId: $cardId)
      }
    `,
    variables: { cardId },
  });
};

const ActionButton = ({ style, ...props }) => {
  const buttonProps = { ...props, children: undefined };
  return (
    <TouchableOpacity style={[styles.button, style]} {...buttonProps}>
      <Text style={styles.buttonLabel}>{props.children}</Text>
    </TouchableOpacity>
  );
};

const CTAButton = (props) => {
  const buttonProps = { ...props, children: undefined };
  return (
    <TouchableOpacity style={[styles.button, styles.cta]} {...buttonProps}>
      <Text style={[styles.buttonLabel, styles.ctaLabel]}>{props.children}</Text>
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
          deck = await getDeckById(params.deckIdToEdit);
          card = deck.cards.find((card) => card.cardId == params.cardIdToEdit);
          if (card && deck.initialCard && deck.initialCard.cardId === card.cardId) {
            card.makeInitialCard = true;
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
    const { card, deck } = await saveDeck(this.state.card, this.state.deck);
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
    const { card, deck } = await saveDeck(this.state.card, this.state.deck);
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

  _handleCardDelete = async () => {
    if (this.state.card.cardId) {
      await deleteCard(this.state.card.cardId);
      this._goToDeck();
    }
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
    // Add a new scene if we don't already have one
    const { card } = this.state;
    if (!card.sceneId) {
      const result = await Session.apolloClient.mutate({
        mutation: gql`
          mutation CreateScene($data: Json!) {
            createScene(data: $data) {
              sceneId
            }
          }
        `,
        variables: {
          data: {
            empty: true,
          },
        },
      });
      sceneId = result.data && result.data.createScene && result.data.createScene.sceneId;
      if (!sceneId) {
        return;
      }
      this._handleCardChange({ sceneId });
    }

    // Set scene editing state and notify Lua
    this.setState({
      isEditingScene: true,
    });
    GhostEvents.sendAsync('SCENE_CREATOR_EDITING', {
      isEditing: true,
    });
  };

  _handleEndEditScene = () => {
    // Unset scene editing state and notify Lua
    this.setState({
      isEditingScene: false,
    });
    GhostEvents.sendAsync('SCENE_CREATOR_EDITING', {
      isEditing: false,
    });
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
    const editSceneAction = card.sceneId ? 'Edit Scene' : 'Add Scene';
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
              isEditable
              onPressBack={this._maybeSaveAndGoToDeck}
              onPressTitle={this._toggleHeaderExpanded}
              onChange={this._handleCardChange}
              onDeleteCard={this._handleCardDelete}
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
                style={styles.scene}
                card={card}
                isEditing={isEditingScene}
                onEndEditing={this._handleEndEditScene}
              />
              {!isEditingScene ? (
                <React.Fragment>
                  <TouchableWithoutFeedback onPress={this._handlePressBackground}>
                    <View style={styles.sceneActions}>
                      <ActionButton onPress={this._handleChooseImage}>
                        {chooseImageAction}
                      </ActionButton>
                      <ActionButton style={{ marginTop: 4 }} onPress={this._handleEditScene}>
                        {editSceneAction}
                      </ActionButton>
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
                    <ActionButton onPress={() => this._handleEditBlock(null)}>
                      Add Block
                    </ActionButton>
                    <ActionButton onPress={this._saveAndGoToDeck}>Done</ActionButton>
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
