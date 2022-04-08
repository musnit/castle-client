import React from 'react';
import { gql } from '@apollo/client';
import { withNavigation } from '../ReactNavigation';
import { CreateCardScreen } from './CreateCardScreen';
import { sendAsync } from '../core/CoreEvents';

import * as AdjustEvents from '../common/AdjustEvents';
import * as Constants from '../Constants';
import * as LocalId from '../common/local-id';
import * as RulesClipboard from './inspector/rules/RulesClipboard';
import * as Sentry from '@sentry/react-native';
import * as Session from '../Session';
import * as Analytics from '../common/Analytics';

const AUTOBACKUP_INTERVAL_MS = 2 * 60 * 1000;

class CreateCardScreenDataProvider extends React.Component {
  state = {
    deck: Constants.EMPTY_DECK,
    cardId: null,
    loading: false,
    isCardChanged: false,
  };

  // doesn't need to be react-stateful
  _variables = [];
  _isNewScene = false;
  _changedSceneData = null;
  _changedBackgroundImage = null;
  _initialSnapshotJson = null;

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
    const prevDeckIdToEdit = prevProps?.route.params?.deckIdToEdit ?? undefined;
    const prevCardIdToEdit = prevProps?.route.params?.cardIdToEdit ?? undefined;
    const prevKitDeckId = prevProps?.route.params?.kitDeckId ?? undefined;
    const params = props.route.params || {};
    if (
      !prevProps ||
      prevDeckIdToEdit !== params.deckIdToEdit ||
      prevCardIdToEdit !== params.cardIdToEdit ||
      prevKitDeckId !== params.kitDeckId
    ) {
      if (!params.deckIdToEdit || !params.cardIdToEdit) {
        throw new Error(`CreateCardScreen requires a deck id and card id`);
      }

      Sentry.addBreadcrumb({
        category: 'create_deck',
        message: `Opening card creator for deckId: ${params.deckIdToEdit} cardId: ${params.cardIdToEdit} kitDeckId: ${params.kitDeckId}`,
        level: Sentry.Severity.Info,
      });
      Sentry.setTag('last_card_id_edited', params.cardIdToEdit);

      let deck = {
        ...JSON.parse(JSON.stringify(Constants.EMPTY_DECK)),
        deckId: params.deckIdToEdit,
      };
      let card = {
        ...JSON.parse(JSON.stringify(Constants.EMPTY_CARD)),
        cardId: params.cardIdToEdit,
      };

      const kitDeckId = params.kitDeckId;

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
        Analytics.logEvent('START_CREATING_NEW_DECK', {
          deckId: deck.deckId,
          kitDeckId,
        });
        AdjustEvents.trackEvent(AdjustEvents.tokens.START_CREATING_NEW_DECK);
      }

      if (kitDeckId) {
        // when starting with a kit deck, use local deck/card id, but clone the scene data
        // and variables from the kit deck
        if (!LocalId.isLocalId(params.deckIdToEdit) || !LocalId.isLocalId(params.cardIdToEdit)) {
          throw new Error(
            `'kitDeckId' must be combined with local (unsaved) deck and card ids to edit`
          );
        }
        const kitDeck = await Session.getDeckById(kitDeckId);
        const kitInitialCard = kitDeck.cards.find(
          (card) => card.cardId === kitDeck.initialCard.cardId
        );
        deck.variables = kitDeck.variables;
        card.scene.data = kitInitialCard.scene.data;
      }

      if (!card.scene) {
        card.scene = JSON.parse(JSON.stringify(Constants.EMPTY_CARD.scene));
      }
      const isNewScene = card.scene.data.empty === true;

      // used by the engine instead of manually reloading the scene data.
      // especially important when cardIdToEdit is different than the deck's top card.
      const initialSnapshotJson = {
        variables: deck.variables,
        sceneData: {
          ...card.scene.data,
        },
        isNewScene,
      };

      if (this._mounted) {
        this._variables = deck.variables;
        this._isNewScene = isNewScene;
        this._initialSnapshotJson = JSON.stringify(initialSnapshotJson);
        this._changedSceneData = card.scene.data; // set initial data in case we save with no changes
        this._changedBackgroundImage = card.backgroundImage;

        this.setState({
          deck,
          cardId: card.cardId,
          loading: false,
          isCardChanged: false,
        });
        this._backupInterval = setInterval(this._saveBackup, AUTOBACKUP_INTERVAL_MS);
      }
    }
  };

  _handleSceneDataChange = (changedSceneData) => {
    this._changedSceneData = changedSceneData;
    this.setState({ isCardChanged: true });
  };

  _handleVariablesChange = (variables, isChanged) => {
    this._variables = variables;
    this.setState({ isCardChanged: isChanged });
  };

  _saveBackup = () => {
    if (this.state.isCardChanged) {
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
    await this.setState({ loading: true });
    if (this.state.isCardChanged) {
      await this._updateScreenshot();
    }
    const cardFragment = this._makeCardSaveFragment();
    const { card, deck } = await Session.saveDeck(cardFragment, this.state.deck, this._variables);
    Analytics.logEvent('SAVE_DECK', {
      deckId: deck.deckId,
      cardId: card.cardId,
    });
    if (!this._mounted) return;
    this.setState({ loading: false, isCardChanged: false });
    return { card, deck };
  };

  _goToDeck = (deckId = null) => {
    if (!deckId) {
      if (this.state.deck?.deckId) {
        deckId = this.state.deck.deckId;
      } else {
        // user tapped back before the deck was finished loading,
        // but we can possibly still get it from existing navigation params
        const params = this.props.route.params || {};
        deckId = params.deckIdToEdit;
      }
    }
    if (deckId && !LocalId.isLocalId(deckId)) {
      // go to deck screen for this existing deck
      this.props.navigation.navigate('CreateDeck', {
        deckIdToEdit: deckId,
        cardIdToEdit: undefined,
        kitDeckId: undefined,
      });
    } else {
      // there is no deck, go back to create index
      this.props.navigation.popToTop();
    }

    Session.markClosedEditor();
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
    if (!LocalId.isLocalId(cardId)) {
      nextCard = this.state.deck.cards.find((card) => card.cardId == cardId);
    }
    if (!nextCard) {
      // #CASTLE-MOBILE-3Q6
      console.warn(
        `Tried to navigate to card: ${cardId} but found no such card, isPlaying = ${isPlaying}`
      );
      return;
    }
    if (!nextCard.scene) {
      // confused by #CASTLE-MOBILE-1ZD
      console.warn(
        `Tried to navigate to card: ${cardId} but it had no scene data, isPlaying = ${isPlaying}`
      );
      return;
    }
    const nextSnapshotJson = {
      variables: this._variables, // engine will ignore if already playing
      sceneData: {
        ...nextCard.scene.data,
      },
    };
    if (isPlaying) {
      // playing - just send snapshot directly to existing editor->player->scene,
      // do not change editor's scene or JS state
      sendAsync('LOAD_SNAPSHOT', { snapshotJson: JSON.stringify(nextSnapshotJson) });
    } else {
      // editing - actually re-init editor with new scene
      this._initialSnapshotJson = JSON.stringify(nextSnapshotJson);
      this._isNewScene = nextCard.scene.data.empty === true;
      this._changedBackgroundImage = null;
      this._changedSceneData = nextCard.scene.data;
      this.setState({ cardId: nextCard.cardId, isCardChanged: false });
    }
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

  _cardNeedsSave = () => this.state.isCardChanged;

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
    this._changedSceneData = data;
    this._changedBackgroundImage = null;
    this._initialSnapshotJson = JSON.stringify({
      variables: this._variables,
      sceneData: {
        ...data,
      },
    });
    // rerender CreateCardScreen with new params
    await this.setState({ loading: false, isCardChanged: true });
  };

  render() {
    const { deck, cardId, loading, isCardChanged } = this.state;

    return (
      <CreateCardScreen
        deck={deck}
        cardId={cardId}
        isNewScene={this._isNewScene}
        initialSnapshotJson={this._initialSnapshotJson}
        loading={loading}
        goToDeck={this._goToDeck}
        goToCard={this._goToCard}
        isCardChanged={isCardChanged}
        saveDeck={this._save}
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

export default withNavigation(CreateCardScreenDataProvider);
