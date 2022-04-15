#pragma once

#include "precomp.h"
#include "bridge.h"
#include "player.h"
#include "gesture.h"
#include "core_views/core_views.h"
#include "screen.h"

#define NUM_FRAME_TIMES 5
#define CAPTION_ANIMATION_DELAY 1.0

struct FeedItem {
  enum OptionalBool {
    Unset,
    True,
    False,
  };

  std::optional<std::string> deckId;
  std::optional<std::string> visibility;
  std::optional<std::string> cardId;
  std::optional<std::string> creatorUserId;
  std::optional<std::string> deckJson;
  std::optional<std::string> lastModified;
  std::optional<std::string> avatarUrl;
  std::shared_ptr<Player> player;
  std::shared_ptr<CoreViewRenderer> coreView;
  std::shared_ptr<CoreViewRenderer> avatarCoreView;
  std::shared_ptr<CoreViewRenderer> errorCoreView;
  float avatarCoreViewLeft = 0;
  bool isLoading = false;
  bool isLoaded = false;
  bool hasRunUpdate = false;
  bool hasRunUpdateSinceLastRender = false;
  bool hasRendered = false;
  bool hasNetworkError = false;
  OptionalBool isCurrentUserReactionToggled = Unset;
  std::optional<int> reactionCount;
  std::optional<int> commentCount;
  float frameTimes[NUM_FRAME_TIMES];
  int frameIndex = 0;
  float loadingTime = 0.0;
  float framesToSkip = 0.0;
  bool isFrozen = false;
  int captionTextWidth = 0;
  int captionDisplayWidth = 0;
  float captionAnimationLeft = 0;
  int captionInitialLeft = 0;
  float captionAnimationDelay = CAPTION_ANIMATION_DELAY;
  std::string caption;
};

class Feed : public Screen {
public:
  explicit Feed(Bridge &bridge_)
      : bridge(bridge_) {
    currentFeedId++;
    feedId = currentFeedId;
    isFeedAlive[feedId] = true;
  }

  ~Feed() {
    isFeedAlive[feedId] = false;
  }

  ScreenType screenType();
  void update(double dt);
  void draw();
  void suspend();
  void resume();
  void clearState();
  void fetchInitialDecks(std::vector<std::string> deckIds, int initialDeckIndex = 0,
      std::optional<std::string> paginateFeedId = std::nullopt, bool isNuxCompleted = false,
      bool isNativeFeedNuxCompleted = false);
  void setWindowSize(int w, int h);
  bool hasScene();
  Scene &getScene();
  void setDeepLinkDeckId(std::string deckId);
  void updateJSReaction(std::string deckId, bool isSelected);
  void addJSComment(std::string deckId);
  void restartDeckJS(std::string deckId);

private:
  mutable love::Transform viewTransform;

  int windowWidth = 800;
  int windowHeight = 1120;

  bool usingFixedDecksList = false;
  bool paused = false;
  Gesture gesture { nullptr };
  std::unique_ptr<love::Shader> shader;
  std::unique_ptr<love::Shader> loadingShader;
  bool hasTouch = false;
  bool dragStarted = false;
  bool ignoreCurrentTouch = false;
  float touchStartOffset = 0.0;
  float touchDuration = 0.0;
  bool isAnimating = false;
  bool isTapGestureAnimation = false;
  bool fetchingDecks = false;
  float animateFromOffset = 0.0;
  float animateToOffset = 0.0;
  float animationTimeElapsed = 0.0;
  float lastTouchPosition = 0.0;
  float preDragOffset = 0.0;
  float offset = 0.0;
  float elapsedTime = 0.0;
  float dragVelocity = 0.0;
  bool hasSetWindowSize = false;
  int initialDeckIndex = 0;
  std::optional<std::string> paginateFeedId;
  bool lastFeedPageWasEmpty = false;
  bool hasGlobalNetworkError = false;
  float timeSinceLastTapGesture = 1.0;
  float timeSinceLastSwipeGesture = 1.0;
  int lastViewFeedItemEventIndex = -1;
  int layoutCoreViewAtIdx = -1;
  bool multilineCaptions = false;

  int cardLeft = 0;
  int cardWidth = 800;
  int cardHeight = 1120;
  int feedItemWidth = 1000;

  std::set<std::string> seenDeckIds;
  std::vector<FeedItem> decks;
  std::string sessionId;
  std::string deepLinkDeckId;
  std::shared_ptr<CoreViewRenderer> globalErrorCoreView;
  std::shared_ptr<love::graphics::Canvas> canvases[4];

  // Nux
  std::shared_ptr<CoreViewRenderer> nuxCoreView;
  bool isShowingNux = false;
  bool nuxIsHidingControls = false;
  float nuxAnimationTime = 0.0;
  float nuxAlpha = 1.0;
  float nuxControlsAlpha = 0.0;
  void renderNux();
  void showNux();
  void showNativeFeedNux();

  void makeShader();
  void fetchMoreDecks();
  int getCurrentIndex();
  float getDragAmount();
  void loadDeckAtIndex(int i);
  void loadDeckFromDeckJson(int i);
  void unloadDeckAtIndex(int i, bool force = false);
  void loadAvatarAtIndex(int i);
  void unloadAvatarAtIndex(int i);
  void networkErrorAtIndex(int i);
  void loadMoreDecksError();
  void removeLoadMoreDecksError();
  void renderCardAtPosition(
      int idx, float position, bool isActive, int focusedIdx, float dragAmount);
  love::graphics::Canvas *newCanvas(int width, int height);
  void renderToCanvas(love::graphics::Canvas *canvas, const std::function<void()> &lambda);
  void layoutCoreViews(int i);
  void renderCardTexture(love::Texture *texture, float time, float brightness);
  void runUpdateAtIndex(int i, double dt);
  void sendViewFeedItemEvent();
  love::graphics::Canvas *canvasForIndex(int i);
  bool isCurrentDeckLoaded();

  Lv &lv { Lv::getInstance() };
  Bridge &bridge;

  int feedId;
  inline static std::map<int, bool> isFeedAlive;
  inline static int currentFeedId = 0;
};

inline ScreenType Feed::screenType() {
  return FEED;
}
