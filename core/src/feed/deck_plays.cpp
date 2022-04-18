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
    sendUpdateWithOldIds(deckId_, cardId_, impressionId_);
    deckId = deckId_;
    cardId = cardId_;
    impressionId = impressionId_;
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

void DeckPlays::sendUpdateWithOldIds(
    std::string newDeckId, std::string newCardId, std::string newImpressionId) {
  if (deckId.empty() || cardId.empty() || newDeckId.empty() || newCardId.empty()) {
    return;
  }

  API::graphql("mutation {\n  recordDeckPlay(deckId: \"" + newDeckId + "\", cardId: \"" + newCardId
          + "\", impressionId: \"" + newImpressionId + "\", oldDeckId: \"" + deckId
          + "\", oldCardId: \"" + cardId + "\", oldImpressionId: \"" + impressionId + "\")\n}",
      [=](APIResponse &response) {
      });
}
