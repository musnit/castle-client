#include "deck_plays.h"
#include "api.h"

const double INITIAL_UPDATE_INTERVAL = 1.0;
const double UPDATE_INTERVAL = 10.0;

DeckPlays::DeckPlays() {
  instance = this;
}

void DeckPlays::setDeckAndCardIds(std::string deckId_, std::string cardId_) {
  if (deckId != deckId_ || cardId != cardId_) {
    sendUpdate();
    // Don't send next update immediately because we don't want server to get them out of order
    timeSinceLastUpdate = UPDATE_INTERVAL - INITIAL_UPDATE_INTERVAL;
    deckId = deckId_;
    cardId = cardId_;
  }
}

void DeckPlays::update(double dt) {
  timeSinceLastUpdate += dt;
  if (timeSinceLastUpdate > UPDATE_INTERVAL) {
    timeSinceLastUpdate = 0.0;
    sendUpdate();
  }
}

void DeckPlays::sendUpdate() {
  if (deckId.empty() || cardId.empty()) {
    return;
  }

  API::graphql(
      "mutation {\n  recordDeckPlay(deckId: \"" + deckId + "\", cardId: \"" + cardId + "\")\n}",
      [=](APIResponse &response) {
      });
}
