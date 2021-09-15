import React from 'react';
import { gql } from '@apollo/client';
import { withNavigation, withNavigationFocus } from '../ReactNavigation';
import { CreateCardScreen } from './CreateCardScreen';
import { sendAsync } from '../core/CoreEvents';

import * as Amplitude from 'expo-analytics-amplitude';
import * as Constants from '../Constants';
import * as LocalId from '../common/local-id';
import * as RulesClipboard from './inspector/rules/RulesClipboard';
import * as Session from '../Session';

const AUTOBACKUP_INTERVAL_MS = 2 * 60 * 1000;

class CreateCardScreenDataProvider extends React.Component {
  state = {
    deck: Constants.EMPTY_DECK,
    cardId: null,
    loading: false,
  };

  // doesn't need to be react-stateful
  _variables = [];
  _isNewScene = false;
  _changedSceneData = null;
  _changedBackgroundImage = null;
  _initialSnapshotJson = null;
  _initialIsEditing = true; // TODO: use?
  _isCardChanged = false;

  componentDidMount() {
    this._mounted = true;
    RulesClipboard.clear();
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
        ...Constants.EMPTY_DECK,
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
            if (!card) {
              // not sure what is causing this (CASTLE-MOBILE-123)
              throw new Error(
                `Tried to edit card id ${params.cardIdToEdit}, but deck ${params.deckIdToEdit} does not contain any such card`
              );
            }
          }
        } catch (e) {
          // don't suppress this error: if the provided id was an existing card id,
          // but the network requests failed, we would risk overriding the existing card
          // with a blank card unless we stop here.
          throw new Error(`Unable to fetch existing deck or card: ${e}`);
        }
      } else {
        // use EMPTY_DECK, but fetch actual creator
        try {
          const result = await Session.apolloClient.query({
            query: gql`
              query Me {
                me {
                  id
                  userId
                  username
                  photo {
                    url
                  }
                }
              }
            `,
          });
          deck.creator = result.data.me;
        } catch (e) {
          throw new Error(`Unable to fetch logged in creator: ${e}`);
        }
        deck.deckId = params.deckIdToEdit;
        Amplitude.logEvent('START_CREATING_NEW_DECK', { deckId: deck.deckId });
      }

      if (!card.scene) {
        card.scene = Constants.EMPTY_CARD.scene;
      }

      // used by the engine instead of manually reloading the scene data.
      // especially important when cardIdToEdit is different than the deck's top card.
      const initialSnapshotJson = {
        variables: deck.variables,
        sceneData: {
          ...card.scene.data,
        },
      };

      if (this._mounted) {
        this._variables = deck.variables;
        this._isNewScene = card.scene.data.empty === true;
        this._initialSnapshotJson = JSON.stringify(initialSnapshotJson);
        this._changedSceneData = card.scene.data; // set initial data in case we save with no changes
        this._changedBackgroundImage = card.backgroundImage;
        this._isCardChanged = false;

        this.setState({
          deck,
          cardId: card.cardId,
          loading: false,
        });
        this._backupInterval = setInterval(this._saveBackup, AUTOBACKUP_INTERVAL_MS);
      }
    }
  };

  _handleSceneDataChange = (changedSceneData) => {
    this._isCardChanged = true;
    this._changedSceneData = changedSceneData;
  };

  _handleVariablesChange = (variables, isChanged) => {
    this._isCardChanged = isChanged;
    this._variables = variables;
  };

  _saveBackup = () => {
    if (this._isCardChanged) {
      const cardFragment = this._makeCardSaveFragment();
      Session.saveDeck(cardFragment, this.state.deck, this._variables, true);
    }
  };

  _updateScreenshot = async () => {
    let screenshotPromise = new Promise((resolve) => {
      this._screenshotPromiseResolve = resolve;
    });
    await sendAsync('REQUEST_SCREENSHOT');

    try {
      let screenshotData = await Promise.race([
        screenshotPromise,
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('timeout')), 5000);
        }),
      ]);

      const backgroundImage = await Session.uploadBase64(screenshotData);
      if (this._mounted && backgroundImage) {
        this._changedBackgroundImage = backgroundImage;
      }
    } catch (e) {
      // screenshot didn't happen in time
    }
    return false;
  };

  _makeCardSaveFragment = () => {
    const cardFragment = {
      cardId: this.state.cardId,
      changedSceneData: this._changedSceneData,
      backgroundImage: this._changedBackgroundImage,
    };
    if (this.state.deck.initialCard && this.state.deck.initialCard.cardId === this.state.cardId) {
      cardFragment.makeInitialCard = true;
    }
    return cardFragment;
  };

  _save = async () => {
    await this._updateScreenshot();
    const cardFragment = this._makeCardSaveFragment();
    const { card, deck } = await Session.saveDeck(cardFragment, this.state.deck, this._variables);
    Amplitude.logEventWithProperties('SAVE_DECK', {
      deckId: deck.deckId,
      cardId: card.cardId,
    });
    if (!this._mounted) return;
    this.setState({ loading: false });
    return { card, deck };
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
        initialIsEditing: true,
      });
    } else {
      // there is no deck, go back to create index
      this.props.navigation.popToTop();
    }
  };

  _saveAndGoToDeck = async () => {
    const result = await this._save();
    if (result) {
      const { deck } = result;
      return this._goToDeck(deck.deckId);
    }
  };

  _goToCard = (nextCardParam, isPlaying) => {
    const { cardId } = nextCardParam;
    if (!cardId) return;

    // we already fetched the whole deck - assemble new snapshot representing next card
    let nextCard = Constants.EMPTY_CARD;
    if (!LocalId.isLocalId(nextCard.cardId)) {
      nextCard = this.state.deck.cards.find((card) => card.cardId == cardId);
    }
    if (isPlaying) {
      // TODO: send initial playing flag
    }
    const nextSnapshotJson = {
      variables: this._variables, // engine will ignore if already playing
      sceneData: {
        ...nextCard.scene.data,
      },
    };
    this._initialSnapshotJson = JSON.stringify(nextSnapshotJson);
    this._isNewScene = nextCard.scene.data.empty === true;
    this._isCardChanged = false;
    this.setState({ cardId: nextCard.cardId });
  };

  _saveAndGoToCard = async (nextCard, isPlaying) => {
    const result = await this._save();
    if (!this._mounted || !result) return;
    const { card, deck } = result;
    await this.setState({
      deck,
      cardId: card.cardId,
    });
    this._goToCard(nextCard, isPlaying);
  };

  _cardNeedsSave = () => this._isCardChanged;

  _handleSceneMessage = (message) => {
    switch (message.messageType) {
      case 'UPDATE_SCENE': {
        this._handleSceneDataChange(message.data);
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

  _handleSceneRevertData = async (data) => {
    // data is a JS object with a `snapshot` key at the top level
    await this.setState({ loading: true });
    this._variables = this.state.deck.variables;
    this._isNewScene = false;
    this._isCardChanged = true;
    this._initialSnapshotJson = JSON.stringify({
      variables: this._variables,
      sceneData: {
        ...data,
      },
    });
    // rerender CreateCardScreen with new params
    await this.setState({ loading: false });
  };

  render() {
    const { deck, cardId, loading } = this.state;

    return (
      <CreateCardScreen
        deck={deck}
        cardId={cardId}
        isNewScene={this._isNewScene}
        initialSnapshotJson={this._initialSnapshotJson}
        initialIsEditing={this._initialIsEditing}
        loading={loading}
        goToDeck={this._goToDeck}
        goToCard={this._goToCard}
        cardNeedsSave={this._cardNeedsSave}
        saveAndGoToDeck={this._saveAndGoToDeck}
        saveAndGoToCard={this._saveAndGoToCard}
        onSceneMessage={this._handleSceneMessage}
        onVariablesChange={this._handleVariablesChange}
        onSceneRevertData={this._handleSceneRevertData}
        saveAction="save"
      />
    );
  }
}

export default withNavigationFocus(withNavigation(CreateCardScreenDataProvider));
