#pragma once

#include "precomp.h"
#include "bridge.h"
#include "player.h"
#include "gesture.h"
#include "core_views/core_views.h"
#include "screen.h"

struct FeedItem {
  std::optional<std::string> deckId;
  std::optional<std::string> deckJson;
  std::shared_ptr<Player> player;
  std::shared_ptr<love::graphics::Canvas> canvas;
  std::shared_ptr<CoreViewRenderer> coreView;
  bool isLoading = false;
  bool isLoaded = false;
  bool hasRunUpdate = false;
  bool hasRunUpdateSinceLastRender = false;
  bool hasRendered = false;
  bool isCurrentUserReactionToggled = false;
  int reactionCount = 0;
};

class Feed : public Screen {
public:
  explicit Feed(Bridge &bridge_)
      : bridge(bridge_) {
  }

  void update(double dt);
  void draw();
  void suspend();
  void resume();
  void clearState();
  void fetchInitialDecks(std::vector<std::string> deckIds);
  void setWindowSize(int w, int h);
  bool hasScene();
  Scene &getScene();
  void setPaused(bool paused);

private:
  mutable love::Transform viewTransform;

  int windowWidth = 800;
  int windowHeight = 1120;

  bool usingFixedDecksList = false;
  bool paused = false;
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

  int cardLeft = 0;
  int cardWidth = 800;
  int cardHeight = 1120;
  int feedItemWidth = 1000;

  std::set<std::string> seenDeckIds;
  std::vector<FeedItem> decks;
  std::string sessionId;

  void makeShader();
  void fetchMoreDecks();
  int getCurrentIndex();
  void loadDeckAtIndex(int i);
  void loadDeckFromDeckJson(int i);
  void unloadDeckAtIndex(int i);
  void renderCardAtPosition(int idx, float position, bool isActive);
  love::graphics::Canvas *newCanvas(int width, int height);
  void renderToCanvas(love::graphics::Canvas *canvas, const std::function<void()> &lambda);

  Lv &lv { Lv::getInstance() };
  Bridge &bridge;
};
