import React from 'react';
import { withNavigation } from '../ReactNavigation';
import { CreateCardScreen } from './CreateCardScreen';
import { sendAsync } from '../core/CoreEvents';

import * as Constants from '../Constants';
import * as LocalId from '../common/local-id';
import * as Sentry from '@sentry/react-native';
import * as Session from '../Session';

class ViewSourceScreenDataProvider extends React.Component {
  state = {
    deck: Constants.EMPTY_DECK,
    cardId: null,
    loading: false,
    isCardChanged: true,
  };

  // doesn't need to be react-stateful
  _variables = [];
  _changedSceneData = null;
  _changedBackgroundImage = null;
  _initialSnapshotJson = null;

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
      prevCardIdToEdit !== params.cardIdToEdit
    ) {
      if (!params.deckIdToEdit || !params.cardIdToEdit) {
        throw new Error(`ViewSourceScreen requires a deck id and card id`);
      }

      Sentry.addBreadcrumb({
        category: 'create_deck',
        message: `Opening view source for deckId: ${params.deckIdToEdit} cardId: ${params.cardIdToEdit}`,
        level: Sentry.Severity.Info,
      });
      Sentry.setTag('last_card_id_edited', params.cardIdToEdit);

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
        this._initialSnapshotJson = JSON.stringify(initialSnapshotJson);
        this._changedSceneData = card.scene.data; // set initial data in case we save with no changes
        this._changedBackgroundImage = card.backgroundImage;

        this.setState({
          deck,
          cardId: card.cardId,
          loading: false,
          isCardChanged: true,
        });
      }
    }
  };

  _handleSceneDataChange = (changedSceneData) => {
    this._changedSceneData = changedSceneData;
    this.setState({ isCardChanged: true });
  };

  _handleVariablesChange = (variables, isChanged) => {
    this._variables = variables;
    this.setState({ isCardChanged: true });
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

    Session.markClosedEditor();
  };

  // saving from the view source screen creates a clone of the deck.
  _saveAndGoToDeck = async () => {
    await this.setState({ loading: true });
    if (this.state.isCardChanged) {
      await this._updateScreenshot();
    }
    const cardFragment = {
      cardId: this.state.cardId,
      changedSceneData: this._changedSceneData,
      backgroundImage: this._changedBackgroundImage,
    };
    const { card, deck } = await Session.saveDeck(
      cardFragment,
      this.state.deck,
      this._variables,
      false,
      this.state.cardId // parent card to clone from
    );

    if (!this._mounted) return;
    await this.setState({ loading: false });

    // reset to top of current nav stack in order to unmount the view source editor
    await this.props.navigation.popToTop();

    // ensure we're at the root/default screen of the Create tab
    await this.props.navigation.navigate('CreateTab');

    // push the new deck onto Create stack
    this.props.navigation.navigate('CreateTab', {
      screen: 'CreateDeck',
      params: {
        deckIdToEdit: deck.deckId,
        cardIdToEdit: undefined,
      },
    });
  };

  _goToCard = (nextCardParam, isPlaying) => {
    const { cardId } = nextCardParam;
    if (!cardId || LocalId.isLocalId(cardId)) return;

    // we already fetched the whole deck - assemble new snapshot representing next card
    let nextCard = this.state.deck.cards.find((card) => card.cardId == cardId);
    if (!nextCard) {
      // don't error - this can happen if the deck contains a reference to a deleted card
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
      this._changedBackgroundImage = null;
      this._changedSceneData = nextCard.scene.data;
      this.setState({ cardId: nextCard.cardId, isCardChanged: true });
    }
  };

  _saveAndGoToCard = async (nextCard) => {
    throw new Error(`Not implemented for ViewSourceScreen`);
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

  _handleSceneRevertData = (data) => {
    // we don't expose backups to View Source screen, so loading a backup
    // should not be possible
    throw new Error(`Not implemented for ViewSourceScreen`);
  };

  render() {
    const { deck, cardId, loading, isCardChanged } = this.state;
    return (
      <CreateCardScreen
        deck={deck}
        cardId={cardId}
        isNewScene={false}
        isViewSource={true}
        initialSnapshotJson={this._initialSnapshotJson}
        loading={loading}
        goToDeck={this._goToDeck}
        goToCard={this._goToCard}
        cardNeedsSave={this._cardNeedsSave}
        isCardChanged={isCardChanged}
        saveDeck={this._saveAndGoToDeck}
        saveAndGoToDeck={this._saveAndGoToDeck}
        saveAndGoToCard={this._saveAndGoToCard}
        onSceneMessage={this._handleSceneMessage}
        onVariablesChange={this._handleVariablesChange}
        onSceneRevertData={this._handleSceneRevertData}
        saveAction={deck.accessPermissions === 'cloneable' ? 'clone' : 'none'}
      />
    );
  }
}

export default withNavigation(ViewSourceScreenDataProvider);
