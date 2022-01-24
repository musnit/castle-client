#pragma once

#include "precomp.h"
#include "feed_interface.h"
#include "core_views/core_views.h"

class HorizontalSwipeFeed : public FeedInterface {
public:
  explicit HorizontalSwipeFeed(Bridge &bridge)
      : FeedInterface(bridge) {
  }

  void update(double dt);
  void draw();

  void fetchInitialDecks();

private:
  mutable love::Transform viewTransform;

  Gesture gesture { nullptr };
  std::unique_ptr<love::Shader> shader;
  bool hasTouch = false;
  bool deckIsFocused = false;
  bool ignoreCurrentTouch = false;
  float touchVelocity = 0.0;
  float touchStartYOffset = 0.0;
  float touchDuration = 0.0;
  bool isAnimating = false;
  bool fetchingDecks = false;
  float animateFromYOffset = 0.0;
  float animateToYOffset = 0.0;
  float animationTimeElapsed = 0.0;
  float lastTouchPosition = 0.0;
  float yOffset = 0.0;
  float elapsedTime = 0.0;

  std::shared_ptr<CoreViewRenderer> coreView;

  std::set<std::string> deckIds;
  std::vector<FeedItem> decks;
  std::string sessionId;

  void makeShader();
  void fetchMoreDecks();
  int getCurrentIndex();
  void loadDeckAtIndex(int i);
  void unloadDeckAtIndex(int i);
  void renderCardAtPosition(int idx, float position, bool isActive);
  love::graphics::Canvas *newCanvas(int width, int height);
  void renderToCanvas(love::graphics::Canvas *canvas, const std::function<void()> &lambda);
};
