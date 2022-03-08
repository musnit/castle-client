#pragma once

#include "precomp.h"

class DeckPlays {
public:
  explicit DeckPlays();

  static DeckPlays &getInstance();

  void setDeckAndCardIds(std::string deckId, std::string cardId);
  void update(double dt);

private:
  inline static DeckPlays *instance = nullptr;
  std::string deckId;
  std::string cardId;
  double timeSinceLastUpdate = 0.0;

  void sendUpdate();
};

inline DeckPlays &DeckPlays::getInstance() {
  if (!instance) {
    instance = new DeckPlays();
  }

  return *instance;
}
