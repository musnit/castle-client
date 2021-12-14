#pragma once

#include "precomp.h"
#include "bridge.h"
#include "player.h"
#include "gesture.h"
#include "play_button_feed.h"
#include "horizontal_tap_feed.h"
#include "horizontal_swipe_feed.h"

class Feed {
public:
  Feed(const Feed &) = delete; // Prevent accidental copies
  const Feed &operator=(const Feed &) = delete;

  explicit Feed(int version, Bridge &bridge) {
    if (version == 0) {
      instance = std::make_unique<PlayButtonFeed>(bridge);
    } else if (version == 1) {
      instance = std::make_unique<HorizontalTapFeed>(bridge);
    } else {
      instance = std::make_unique<HorizontalSwipeFeed>(bridge);
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
