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
  bool shouldFocus;
  float focusPercent;
};

class FeedInterface {
public:
  explicit FeedInterface(Bridge &bridge_)
      : bridge(bridge_) {
  }
  virtual ~FeedInterface() = default;

  virtual void update(double dt) = 0;
  virtual void draw() = 0;
  virtual void fetchInitialDecks() = 0;

protected:
  Lv &lv { Lv::getInstance() };
  Bridge &bridge;

  float cubicEaseInOut(float p) {
    return 3.0 * p * p - 2.0 * p * p * p;
  }

  float smoothstep(float a, float b, float t) {
    return (b - a) * cubicEaseInOut(t) + a;
  }
};
