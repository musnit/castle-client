#pragma once

#include "precomp.h"
#include "bridge.h"
#include "player.h"
#include "gesture.h"
#include "core_views/core_views.h"

struct FeedItem {
  std::string deckJson;
  std::shared_ptr<Player> player;
  std::shared_ptr<love::graphics::Canvas> canvas;
  std::shared_ptr<CoreViewRenderer> coreView;
  bool isLoaded = false;
  bool hasRunUpdate = false;
  bool hasRunUpdateSinceLastRender = false;
  bool hasRendered = false;
};

class Feed {
public:
  explicit Feed(Bridge &bridge_)
      : bridge(bridge_) {
  }

  void update(double dt);
  void draw();
  void fetchInitialDecks();
  void setWindowSize(int w, int h);

private:
  mutable love::Transform viewTransform;

  int windowWidth = 800;
  int windowHeight = 1120;

  Gesture gesture { nullptr };
  std::unique_ptr<love::Shader> shader;
  bool hasTouch = false;
  bool dragStarted = false;
  bool deckIsFocused = false;
  bool ignoreCurrentTouch = false;
  float touchStartOffset = 0.0;
  float touchDuration = 0.0;
  bool isAnimating = false;
  bool fetchingDecks = false;
  float animateFromOffset = 0.0;
  float animateToOffset = 0.0;
  float animationTimeElapsed = 0.0;
  float lastTouchPosition = 0.0;
  float preDragOffset = 0.0;
  float offset = 0.0;
  float elapsedTime = 0.0;
  float dragVelocity = 0.0;

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

  Lv &lv { Lv::getInstance() };
  Bridge &bridge;
};
