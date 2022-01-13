#pragma once

#define TEST_DECK_ID "xzq58MkR5"
#define TEST_DISABLE_CANVAS true

#include "precomp.h"
#include "bridge.h"
#include "player.h"
#include "gesture.h"
#include "play_button_feed.h"
#include "horizontal_tap_feed.h"
#include "horizontal_swipe_feed.h"
#include "vertical_swipe_feed.h"

class Feed {
public:
  Feed(const Feed &) = delete; // Prevent accidental copies
  const Feed &operator=(const Feed &) = delete;

  explicit Feed(int version, Bridge &bridge) {
    if (version == 0) {
      instance = std::make_unique<PlayButtonFeed>(bridge);
    } else if (version == 1) {
      instance = std::make_unique<HorizontalTapFeed>(bridge);
    } else if (version == 2) {
      instance = std::make_unique<HorizontalSwipeFeed>(bridge);
    } else {
      instance = std::make_unique<VerticalSwipeFeed>(bridge);
    }
  }

  void update(double dt) {
    instance->update(dt);
  }

  void draw() {
    instance->draw();
  }

  void fetchInitialDecks() {
    instance->fetchInitialDecks();
  }

private:
  std::unique_ptr<FeedInterface> instance;
};
