#include "deck_plays.h"
#include "api.h"

const double UPDATE_INTERVAL = 3.0;

DeckPlays::DeckPlays() {
  instance = this;
}

void DeckPlays::setDeckAndCardIds(
    std::string deckId_, std::string cardId_, std::string impressionId_) {
  if (deckId != deckId_ || cardId != cardId_) {
    timeSinceLastUpdate = 0.0;
    deckId = deckId_;
    cardId = cardId_;
    impressionId = impressionId_;
    sendUpdate();
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

  API::graphql("mutation {\n  recordDeckPlay(deckId: \"" + deckId + "\", cardId: \"" + cardId
          + "\", impressionId: \"" + impressionId + "\")\n}",
      [=](APIResponse &response) {
      });
}
