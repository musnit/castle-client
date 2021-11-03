#pragma once

#include "precomp.h"
#include "bridge.h"
#include "player.h"
#include "gesture.h"

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
  love::graphics::Canvas *gameCanvas = nullptr;
  mutable love::Transform viewTransform;

  std::unique_ptr<Gesture> gesture;
  bool hasTouch = false;
  float lastTouchPosition = 0.0;
  float yOffset = 0.0;

  std::vector<std::string> decks;
  std::vector<std::unique_ptr<Player>> players;

  int getCurrentIndex();
  void loadDeckAtIndex(int i);
  void renderCardAtPosition(int idx, float position);
  love::graphics::Canvas *newCanvas(int width, int height);
  void renderToCanvas(love::graphics::Canvas *canvas, const std::function<void()> &lambda);
};
