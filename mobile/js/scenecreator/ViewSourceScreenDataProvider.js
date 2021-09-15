import React from 'react';
import { withNavigation, withNavigationFocus } from '../ReactNavigation';
import { CreateCardScreen } from './CreateCardScreen';
import { sendAsync } from '../core/CoreEvents';

import * as Constants from '../Constants';
import * as LocalId from '../common/local-id';
import * as Session from '../Session';

class ViewSourceScreenDataProvider extends React.Component {
  state = {
    deck: Constants.EMPTY_DECK,
    cardId: null,
    loading: false,
  };

  // doesn't need to be react-stateful
  _variables = [];
  _changedSceneData = null;
  _changedBackgroundImage = null;
  _initialSnapshotJson = null;
  _isCardChanged = false;

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
  };

  // saving from the view source screen creates a clone of the deck.
  _saveAndGoToDeck = async () => {
    await this.setState({ loading: true });
    if (this._isCardChanged) {
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

  _handleSceneRevertData = (data) => {
    // we don't expose backups to View Source screen, so loading a backup
    // should not be possible
    throw new Error(`Not implemented for ViewSourceScreen`);
  };

  render() {
    const { deck, cardId, loading } = this.state;
    return (
      <CreateCardScreen
        deck={deck}
        cardId={cardId}
        isNewScene={false}
        initialSnapshotJson={this._initialSnapshotJson}
        initialIsEditing={this.props.initialIsEditing}
        loading={loading}
        goToDeck={this._goToDeck}
        goToCard={this._goToCard}
        cardNeedsSave={this._cardNeedsSave}
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

export default withNavigationFocus(withNavigation(ViewSourceScreenDataProvider));
