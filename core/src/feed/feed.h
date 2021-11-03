#pragma once

#include "precomp.h"
#include "bridge.h"
#include "player.h"
#include "gesture.h"

struct FeedItem {
  std::string deckJson;
  std::unique_ptr<Player> player;
  std::unique_ptr<love::graphics::Canvas> canvas;
  bool isLoaded;
  bool hasRunUpdate;
  bool hasRendered;
};

class Feed {
  // manages a scene instance that is being edited.

public:
  Feed(const Feed &) = delete; // Prevent accidental copies
  const Feed &operator=(const Feed &) = delete;

  explicit Feed(Bridge &bridge_);

  void update(double dt);
  void draw();

  void loadDecks(const char *decksJson);

private:
  Lv &lv { Lv::getInstance() };
  Bridge &bridge;
  mutable love::Transform viewTransform;

  std::unique_ptr<Gesture> gesture;
  bool hasTouch = false;
  float lastTouchPosition = 0.0;
  float yOffset = 0.0;

  std::vector<FeedItem> decks;

  int getCurrentIndex();
  void loadDeckAtIndex(int i);
  void renderCardAtPosition(int idx, float position, bool isActive);
  love::graphics::Canvas *newCanvas(int width, int height);
  void renderToCanvas(love::graphics::Canvas *canvas, const std::function<void()> &lambda);
};
