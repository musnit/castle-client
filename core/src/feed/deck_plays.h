#pragma once

#include "precomp.h"

class DeckPlays {
public:
  explicit DeckPlays();

  static DeckPlays &getInstance();

  void setDeckAndCardIds(std::string deckId, std::string cardId, std::string impressionId);
  void update(double dt);

private:
  inline static DeckPlays *instance = nullptr;
  std::string deckId;
  std::string cardId;
  std::string impressionId;
  double timeSinceLastUpdate = 0.0;

  void sendUpdate();
  void sendUpdateWithOldIds(
      std::string newDeckId, std::string newCardId, std::string newImpressionId);
};

inline DeckPlays &DeckPlays::getInstance() {
  if (!instance) {
    instance = new DeckPlays();
  }

  return *instance;
}
