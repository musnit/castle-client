import React from 'react';
import { withNavigation, withNavigationFocus } from '../ReactNavigation';
import { CreateCardScreen } from './CreateCardScreen';

import _ from 'lodash';

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
        deckState: Utilities.makeInitialDeckState({
          ...state.card,
          variables: changes,
        }),
      };
    });
  };

  _updateScreenshot = async () => {
    let screenshotPromise = new Promise((resolve) => {
      this._screenshotPromiseResolve = resolve;
    });
    await GhostEvents.sendAsync('REQUEST_SCREENSHOT');

    try {
      let screenshotData = await Promise.race([
        screenshotPromise,
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('timeout')), 5000);
        }),
      ]);

      const backgroundImage = await Session.uploadBase64(screenshotData);
      if (this._mounted && backgroundImage) {
        return this._handleCardChange({
          backgroundImage,
        });
      }
    } catch (e) {
      // screenshot didn't happen in time
    }
    return false;
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

  // saving from the view source screen creates a clone of the deck.
  _saveAndGoToDeck = async () => {
    await this.setState({ loading: true });
    if (this.state.card.isChanged) {
      await this._updateScreenshot();
    }
    const { card, deck } = await Session.saveDeck(
      this.state.card,
      this.state.deck,
      this.state.card.variables,
      false,
      this.state.card.cardId // parent card to clone from
    );

    if (!this._mounted) return;
    await this.setState({ loading: false });

    // specify both the outer tab (Create) and the inner screen (CreateDeck)
    // because we don't know whether we are already on the Create tab
    this.props.navigation.navigate('Create', {
      screen: 'CreateDeck',
      params: {
        deckIdToEdit: deck.deckId,
        cardIdToEdit: undefined,
      },
    });
  };

  _goToCard = (nextCard) => {
    setTimeout(() => {
      this.props.navigation.navigate('ViewSource', {
        deckIdToEdit: this.state.deck.deckId,
        cardIdToEdit: nextCard.cardId,
      });
    }, 100);
  };

  _saveAndGoToCard = async (nextCard) => {
    throw new Error(`Not implemented for ViewSourceScreen`);
  };

  _cardNeedsSave = () => this.state.card?.isChanged;

  _handleSceneMessage = (message) => {
    switch (message.messageType) {
      case 'UPDATE_SCENE': {
        this._handleCardChange({
          changedSceneData: message.data,
        });
        break;
      }
      case 'CHANGE_DECK_STATE': {
        let deckState = {
          ...this.state.deckState,
          ...message.data,
        };

        if (!_.isEqual(deckState, this.state.deckState)) {
          this.setState({
            deckState: {
              ...deckState,
              setFromLua: true,
            },
          });
        }
        break;
      }
      case 'SCREENSHOT_DATA': {
        if (this._screenshotPromiseResolve) {
          this._screenshotPromiseResolve(message.data);
          this._screenshotPromiseResolve = null;
        }
        break;
      }
    }
  };

  _handleSceneRevertData = (data) => {
    // we don't expose backups to View Source screen, so loading a backup
    // should not be possible
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
          saveAction={deck.accessPermissions === 'cloneable' ? 'clone' : 'none'}
        />
      </GhostUI.Provider>
    );
  }
}

export default withNavigationFocus(withNavigation(ViewSourceScreenDataProvider));
