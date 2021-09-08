import React from 'react';
import { gql } from '@apollo/client';
import { ReactNativeFile } from 'apollo-upload-client';
import { withNavigation, withNavigationFocus } from '../ReactNavigation';
import { CreateCardScreen } from './CreateCardScreen';
import { sendAsync } from '../core/CoreEvents';

import * as Amplitude from 'expo-analytics-amplitude';
import * as Constants from '../Constants';
import * as GhostEvents from '../ghost/GhostEvents';
import * as LocalId from '../common/local-id';
import * as RulesClipboard from './inspector/rules/RulesClipboard';
import * as Session from '../Session';

const AUTOBACKUP_INTERVAL_MS = 2 * 60 * 1000;

class CreateCardScreenDataProvider extends React.Component {
  state = {
    deck: Constants.EMPTY_DECK,
    card: Constants.EMPTY_CARD,
    isNewScene: false,
    loading: false,
  };

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

      if (this._mounted) {
        //console.log(`initial card: ${JSON.stringify(card, null, 2)}`);
        this.setState(
          {
            deck,
            card,
            isNewScene: card.scene.data.empty === true,
          },
          async () => {
            const { card } = this.state;
            GhostEvents.sendAsync('SCENE_CREATOR_EDITING', {
              isEditing: params.initialIsEditing === false ? false : true,
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

  _saveBackup = () => {
    // TODO: support saving and backups
    // TODO: read variables from engine
    // Session.saveDeck(this.state.card, this.state.deck, this.state.card.variables, true);
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
        return this._handleCardChange({
          backgroundImage,
        });
      }
    } catch (e) {
      // screenshot didn't happen in time
    }
    return false;
  };

  _save = async () => {
    await this._updateScreenshot();
    const { card, deck } = await Session.saveDeck(
      this.state.card,
      this.state.deck,
      this.state.card.variables
    );
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

  _goToCard = (nextCard, isPlaying) => {
    setTimeout(() => {
      this.props.navigation.navigate('CreateDeck', {
        deckIdToEdit: this.state.deck.deckId,
        cardIdToEdit: nextCard.cardId,
        initialIsEditing: !isPlaying,
      });
    }, 100);
  };

  _saveAndGoToCard = async (nextCard, isPlaying) => {
    const result = await this._save();
    if (!this._mounted || !result) return;
    const { card, deck } = result;
    await this.setState({ card, deck });
    this._goToCard(nextCard, isPlaying);
  };

  _cardNeedsSave = () => this.state.card?.isChanged;

  _handleSceneMessage = (message) => {
    switch (message.messageType) {
      case 'UPDATE_SCENE': {
        //console.log(`new scene data: ${message.data}`);
        this._handleCardChange({
          changedSceneData: message.data,
        });
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
    // data is a JS object with a `snapshot` key at the top level
    GhostEvents.sendAsync('LOAD_SNAPSHOT', {
      data,
    });
  };

  render() {
    const { deck, card, isNewScene, loading } = this.state;

    return (
      <CreateCardScreen
        deck={deck}
        card={card}
        isNewScene={isNewScene}
        initialIsEditing={this.props.initialIsEditing}
        loading={loading}
        goToDeck={this._goToDeck}
        goToCard={this._goToCard}
        cardNeedsSave={this._cardNeedsSave}
        saveAndGoToDeck={this._saveAndGoToDeck}
        saveAndGoToCard={this._saveAndGoToCard}
        onSceneMessage={this._handleSceneMessage}
        onSceneRevertData={this._handleSceneRevertData}
        saveAction="save"
      />
    );
  }
}

export default withNavigationFocus(withNavigation(CreateCardScreenDataProvider));
