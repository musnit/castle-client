import React from 'react';
import { withNavigation, withNavigationFocus } from '../ReactNavigation';
import { CreateCardScreen } from './CreateCardScreen';

import * as Constants from '../Constants';
import * as GhostEvents from '../ghost/GhostEvents';
import * as GhostUI from '../ghost/GhostUI';
import * as LocalId from '../common/local-id';
import * as Session from '../Session';
import * as Utilities from '../common/utilities';

class ViewSourceScreenDataProvider extends React.Component {
  state = {
    deck: Constants.EMPTY_DECK,
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
        throw new Error(`ViewSourceScreen requires a deck id and card id`);
      }

      let deck = {
        ...Constants.EMPTY_DECK,
        deckId: params.deckIdToEdit,
      };
      let card = {
        ...Constants.EMPTY_CARD,
        cardId: params.cardIdToEdit,
      };

      if (LocalId.isLocalId(params.deckIdToEdit)) {
        throw new Error(`ViewSourceScreen can't inspect unsaved cards`);
      }
      try {
        deck = await Session.getDeckById(params.deckIdToEdit);
        card = deck.cards.find((card) => card.cardId == params.cardIdToEdit);
      } catch (e) {
        throw new Error(`Unable to fetch existing deck or card: ${e}`);
      }

      // kludge: this allows us to check the screen's dirty state based on
      // the card onChange callback everywhere (even when you modify variables, a
      // property of the deck)
      card.variables = deck.variables;

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

  _saveBackup = () => {
    throw new Error(`Not implemented for ViewSourceScreen`);
  };

  _save = async () => {
    throw new Error(`Not implemented for ViewSourceScreen`);
  };

  _goToDeck = (deckId = null) => {
    if (!deckId && this.state.deck) {
      deckId = this.state.deck.deckId;
    }
    if (deckId) {
      this.props.navigation.navigate('ViewSource', {
        deckIdToEdit: deckId,
        cardIdToEdit: undefined,
      });
    } else {
      this.props.navigation.popToTop();
    }
  };

  _saveAndGoToDeck = async () => {
    throw new Error(`Not implemented for ViewSourceScreen`);
  };

  _goToCard = (nextCard) => {
    // TODO:
  };

  _saveAndGoToCard = async (nextCard) => {
    throw new Error(`Not implemented for ViewSourceScreen`);
  };

  _cardNeedsSave = () => false; // never prompt to save

  _handleSceneScreenshot = async () => {
    // noop for ViewSourceScreen
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
    throw new Error(`Not implemented for ViewSourceScreen`);
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
          cardNeedsSave={this._cardNeedsSave}
          saveAndGoToDeck={this._saveAndGoToDeck}
          saveAndGoToCard={this._saveAndGoToCard}
          onVariablesChange={this._handleVariablesChange}
          onSceneMessage={this._handleSceneMessage}
          onSceneRevertData={this._handleSceneRevertData}
          onSceneScreenshot={this._handleSceneScreenshot}
          isDeckOwner={false}
        />
      </GhostUI.Provider>
    );
  }
}

export default withNavigationFocus(withNavigation(ViewSourceScreenDataProvider));
