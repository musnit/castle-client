import React from 'react';
import gql from 'graphql-tag';
import { ReactNativeFile } from 'apollo-upload-client';
import { withNavigation, withNavigationFocus } from '@react-navigation/compat';
import { CreateCardScreen } from './CreateCardScreen';

import * as Constants from '../Constants';
import * as GhostEvents from '../ghost/GhostEvents';
import * as GhostUI from '../ghost/GhostUI';
import * as LocalId from '../common/local-id';
import * as Session from '../Session';
import * as Utilities from '../common/utilities';

const AUTOBACKUP_INTERVAL_MS = 2 * 60 * 1000;

const EMPTY_DECK = {
  title: '',
  cards: [],
  variables: [],
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

export default withNavigationFocus(withNavigation(CreateCardScreenDataProvider));
