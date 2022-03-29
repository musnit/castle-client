#include "feed.h"
#include "engine.h"
#include "archive.h"
#include "behaviors/all.h"
#include "library.h"
#include "api.h"
#include <thread>
#include "utils/format_number.h"
#include "deck_plays.h"
#include "data/embedded_deck_data.h"
#include "archive.h"

#define TOP_PADDING 0
// #define CAPTIONS_ENABLED
#define PREV_NEXT_TAP_MAX_DURATION 0.3
#define MIN_TIME_BETWEEN_TAP_GESTURES 0.5
#define CORE_VIEWS_GESTURE_INACTIVE_AFTER_SWIPE_TIME 0.4
#define NUX_ANIMATION_TIME 3.0
#define NUX_ANIMATION_ALPHA_TIME 0.5;
#define NUX_DECK_ID "lSTWWH6Kw"
#define NUX_LAST_CARD_ID "aXLpBac-w"

#define BOTTOM_UI_MIN_HEIGHT 140

#define TIME_BEFORE_FORCE_LOADING_NEXT_DECK 1.0

// #define DEBUG_CLICK_TO_ADVANCE
// #define DEBUG_AUTO_ADVANCE

// creator.photo.url and initialCard.backgroundImage.smallUrl needed for DeckRemixesScreen
const std::string GRAPHQL_DECK_FIELDS
    = "\ndeckId\ncaption\nlastModified\nvariables\nchildDecksCount\nvisibility\n"
      "parentDeckId\n"
      "parentDeck {\n"
      "  deckId\n"
      "  creator { username }\n"
      "}\n"
      "creator "
      "{\nuserId\nusername\nphoto "
      "{\nsmallAvatarUrl\nurl\n}\n}\ninitialCard {\n    "
      "    cardId\nsceneDataUrl\nbackgroundImage {\nsmallUrl}\n      }\n    commentsEnabled\n  "
      "comments "
      "{\n count\n }\n reactions {\n "
      "reactionId\n isCurrentUserToggled\n count\n }";
const char *DEFAULT_AVATAR_URL
    = "https://castle.imgix.net/"
      "36a7bdff06fefd3da13194fdff873bc5?auto=compress&fit=crop&max-w=128&max-h=128&ar=1:1";

float cubicEaseIn(float p) {
  return p * p * p;
}

float cubicEaseInOut(float p) {
  return 3.0 * p * p - 2.0 * p * p * p;
}

float quadEaseOut(float t) {
  return -1.0 * t * (t - 2.0);
}

float cubicEaseOut(float t) {
  t -= 1.0;
  return (t * t * t + 1.0);
}

float quartEaseOut(float t) {
  t -= 1.0;
  return -1.0 * (t * t * t * t - 1.0);
}

float quintEaseOut(float t) {
  t -= 1.0;
  return (t * t * t * t * t + 1.0);
}

float sinEaseOut(float t) {
  return sinf(t * (M_PI / 2.0));
}

float expoEaseOut(float t) {
  return -powf(2, -10 * t) + 1.0;
}

float circEaseOut(float t) {
  t -= 1.0;
  return sqrtf(1.0 - t * t);
}

float smoothstep(float a, float b, float t, int easingFunction) {
  switch (easingFunction) {
  case 0:
    return (b - a) * cubicEaseIn(t) + a;
  case 1:
    return (b - a) * cubicEaseInOut(t) + a;
  case 2:
    return (b - a) * quadEaseOut(t) + a;
  case 3:
    return (b - a) * cubicEaseOut(t) + a;
  case 4:
    return (b - a) * quartEaseOut(t) + a;
  case 5:
    return (b - a) * quintEaseOut(t) + a;
  case 6:
    return (b - a) * sinEaseOut(t) + a;
  case 7:
    return (b - a) * expoEaseOut(t) + a;
  case 8:
    return (b - a) * circEaseOut(t) + a;
  case 9:
    return (b - a) * t + a;
  default:
    return 0;
  }
}

struct NuxCompletedEvent {};

void Feed::setWindowSize(int w, int h) {
  windowWidth = w;
  windowHeight = h;

  float aspectRatio = (float)w / (float)(h - BOTTOM_UI_MIN_HEIGHT);
  float cardAspectRatio = 800.0 / 1120.0;

  int oldCardWidth = cardWidth;
  int oldCardHeight = cardHeight;

  if (aspectRatio > cardAspectRatio) {
    // screen is wide
    cardHeight = h - BOTTOM_UI_MIN_HEIGHT;
    cardWidth = ((float)cardHeight) * cardAspectRatio;
    cardLeft = (w - cardWidth) * 0.5;
  } else {
    // screen is tall
    cardWidth = w;
    cardHeight = ((float)cardWidth) / cardAspectRatio;
    cardLeft = 0;
  }

  feedItemWidth = w;

  if (!hasSetWindowSize) {
    offset = -initialDeckIndex * feedItemWidth;
  }

  if (cardWidth != oldCardWidth || cardHeight != oldCardHeight) {
    for (size_t i = 0; i < decks.size(); i++) {
      if (decks[i].coreView) {
        decks[i].coreView->updateProp("container", "top", std::to_string(cardHeight));
      }

      if (decks[i].avatarCoreView) {
        decks[i].avatarCoreView->updateProp("container", "top", std::to_string(cardHeight));
      }

      if (decks[i].player && decks[i].player->hasScene()) {
        decks[i].player->getScene().getGesture().setBounds(
            cardLeft, TOP_PADDING, cardWidth, cardHeight);
      }
    }

    for (size_t i = 0; i < 4; i++) {
      canvases[i].reset();
    }

    if (nuxCoreView) {
      nuxCoreView->updateProp("container", "top", std::to_string(cardHeight));
    }
  }

  hasSetWindowSize = true;
}

int Feed::getCurrentIndex() {
  int idx = floor((feedItemWidth / 2.0 - offset) / feedItemWidth);
  if (idx < 0) {
    idx = 0;
  }
  if (idx >= (int)decks.size()) {
    idx = decks.size() - 1;
  }

  return idx;
}

// if draging to right, goes from 0 to 0.5 and then switches to -0.5 to 0
float Feed::getDragAmount() {
  return ((float)-offset / feedItemWidth) - getCurrentIndex();
}

bool Feed::hasScene() {
  int idx = getCurrentIndex();
  return idx >= 0 && idx < (int)decks.size() && decks[idx].player && decks[idx].player->hasScene();
}

Scene &Feed::getScene() {
  int idx = getCurrentIndex();
  return decks[idx].player->getScene();
}

void Feed::update(double dt) {
  bool wasLongFrame = dt > 0.1;

  if (dt > 0.5) {
    dt = 1.0 / 60.0;
  }

  float SCROLL_ANIMATION_TIME = CoreViews::getInstance().getNumConstant("SCROLL_ANIMATION_TIME");
  float DRAG_START_OFFSET = CoreViews::getInstance().getNumConstant("DRAG_START_OFFSET");
  float SCROLL_MULTIPLIER = CoreViews::getInstance().getNumConstant("SCROLL_MULTIPLIER");
  float FAST_SWIPE_MAX_DURATION
      = CoreViews::getInstance().getNumConstant("FAST_SWIPE_MAX_DURATION");
  float FAST_SWIPE_MIN_OFFSET = CoreViews::getInstance().getNumConstant("FAST_SWIPE_MIN_OFFSET");
  float FAST_SWIPE_MIN_DRAG_VELOCITY
      = CoreViews::getInstance().getNumConstant("FAST_SWIPE_MIN_DRAG_VELOCITY");
  float DRAG_VELOCITY_ROLLING_AVERAGE_TIME
      = CoreViews::getInstance().getNumConstant("DRAG_VELOCITY_ROLLING_AVERAGE_TIME");

  int fps = lv.timer.getFPS();
  Debug::display("fps: {}", fps);
  elapsedTime += dt;
  nuxAnimationTime += dt;
  timeSinceLastTapGesture += dt;
  timeSinceLastSwipeGesture += dt;
  if (dragStarted || isAnimating) {
    nuxAlpha -= dt / NUX_ANIMATION_ALPHA_TIME;
    if (nuxAlpha < 0.0) {
      nuxAlpha = 0.0;
      nuxAnimationTime = 0.0;
    }
  } else {
    nuxAlpha += dt / NUX_ANIMATION_ALPHA_TIME;
    if (nuxAlpha > 1.0) {
      nuxAlpha = 1.0;
    }
  }
  if (nuxControlsAlpha < 1.0 && !nuxIsHidingControls) {
    nuxControlsAlpha += dt / NUX_ANIMATION_ALPHA_TIME;
    if (nuxControlsAlpha > 1.0) {
      nuxControlsAlpha = 1.0;
    }
  }

  gesture.update();
  gesture.withSingleTouch([&](const Touch &touch) {
    if (touch.pressed) {
      // ignore the touch if the current animation is from a tap gesture
      // for tap gestures, we don't allow you to interrupt the animation since that feels bad if
      // you are spamming taps
      // for swipe gestures, allow interrupting the animation since it's usually intentional
      ignoreCurrentTouch = touch.screenPos.y < cardHeight + TOP_PADDING || isTapGestureAnimation;
    }

    if (nuxIsHidingControls) {
      return;
    }

    if (ignoreCurrentTouch) {
      return;
    }

    isAnimating = false;
    isTapGestureAnimation = false;

    if (!hasTouch) {
      hasTouch = true;
      touchDuration = 0.0;
      touchStartOffset = offset;
      dragStarted = false;
      preDragOffset = 0.0;
      dragVelocity = 0.0;
    } else {
      if (!dragStarted) {
        preDragOffset += touch.screenPos.x - lastTouchPosition;

        if (fabs(preDragOffset) > DRAG_START_OFFSET) {
          dragStarted = true;

          int idx = getCurrentIndex();
          if (idx >= 0 && idx < (int)decks.size()) {
            if (decks[idx].player) {
              decks[idx].player->suspend();
            }

            if (decks[idx].coreView) {
              decks[idx].coreView->cancelGestures();
            }

            if (decks[idx].avatarCoreView) {
              decks[idx].avatarCoreView->cancelGestures();
            }
          }
        }
      }

      if (dragStarted) {
        if (offset > 0.0) {
          // Scrolling before the first deck
          float multiplier = (200.0 - offset) / 150.0;
          if (multiplier < 0.0) {
            multiplier = 0.0;
          }
          offset += (touch.screenPos.x - lastTouchPosition) * multiplier;
        } else if (offset < (-feedItemWidth * ((float)decks.size() - 1.0))) {
          // Scrolling past the last deck
          float distancePastEnd = (-feedItemWidth * ((float)decks.size() - 1)) - offset;
          float multiplier = (200.0 - distancePastEnd) / 150.0;
          if (multiplier < 0.0) {
            multiplier = 0.0;
          }
          offset += (touch.screenPos.x - lastTouchPosition) * multiplier;
        } else {
          offset += (touch.screenPos.x - lastTouchPosition) * SCROLL_MULTIPLIER;
        }

        float rollingAvgAmt = dt / DRAG_VELOCITY_ROLLING_AVERAGE_TIME;
        dragVelocity = (touch.screenPos.x - lastTouchPosition) * rollingAvgAmt
            + dragVelocity * (1.0 - rollingAvgAmt);
      }
    }

    lastTouchPosition = touch.screenPos.x;
    touchDuration += dt;

    if (touch.released) {
      hasTouch = false;

      if (dragStarted) {
        isAnimating = true;
        dragStarted = false;
        animateFromOffset = offset;
        animationTimeElapsed = 0.0;

        if (touchDuration < FAST_SWIPE_MAX_DURATION
            && fabs(offset - touchStartOffset) > FAST_SWIPE_MIN_OFFSET) {
          if (offset - touchStartOffset > 0) {
            animateToOffset = (round(touchStartOffset / feedItemWidth) + 1) * feedItemWidth;
            timeSinceLastSwipeGesture = 0.0;
          } else {
            animateToOffset = (round(touchStartOffset / feedItemWidth) - 1) * feedItemWidth;
            timeSinceLastSwipeGesture = 0.0;
          }
        } else if (fabs(dragVelocity) > FAST_SWIPE_MIN_DRAG_VELOCITY) {
          if (dragVelocity > 0) {
            animateToOffset = (round(touchStartOffset / feedItemWidth) + 1) * feedItemWidth;
            timeSinceLastSwipeGesture = 0.0;
          } else {
            animateToOffset = (round(touchStartOffset / feedItemWidth) - 1) * feedItemWidth;
            timeSinceLastSwipeGesture = 0.0;
          }
        } else {
          animateToOffset = round((offset) / feedItemWidth) * feedItemWidth;
        }
      } else if (!touch.movedFar && touchDuration < PREV_NEXT_TAP_MAX_DURATION
          && timeSinceLastTapGesture > MIN_TIME_BETWEEN_TAP_GESTURES && !isShowingNux
          && !isAnimating) {
        bool coreViewHasGesture = false;
        int idx = getCurrentIndex();
        if (decks[idx].coreView) {
          auto gestureViewId = decks[idx].coreView->gestureViewId();
          if (gestureViewId && *gestureViewId != "container") {
            coreViewHasGesture = true;
          }
        }

        if (!coreViewHasGesture && decks[idx].avatarCoreView) {
          auto gestureViewId = decks[idx].avatarCoreView->gestureViewId();
          if (gestureViewId && *gestureViewId != "container") {
            coreViewHasGesture = true;
          }
        }

        if (!coreViewHasGesture) {
          if (touch.screenPos.x > windowWidth * 0.9) {
            timeSinceLastTapGesture = 0.0;
            isAnimating = true;
            isTapGestureAnimation = true;
            animateFromOffset = offset;
            animationTimeElapsed = 0.0;
            animateToOffset = (round(touchStartOffset / feedItemWidth) - 1) * feedItemWidth;
          } else if (touch.screenPos.x < windowWidth * 0.1) {
            timeSinceLastTapGesture = 0.0;
            isAnimating = true;
            isTapGestureAnimation = true;
            animateFromOffset = offset;
            animationTimeElapsed = 0.0;
            animateToOffset = (round(touchStartOffset / feedItemWidth) + 1) * feedItemWidth;
          }
        }
      }

#ifdef DEBUG_CLICK_TO_ADVANCE
      isAnimating = true;
      animateFromOffset = offset;
      animationTimeElapsed = 0.0;
      animateToOffset = (round(touchStartOffset / feedItemWidth) - 1) * feedItemWidth;
#endif

      // Don't allow animating to before the first card
      if (animateToOffset > 0.0) {
        animateToOffset = 0.0;
      }
      if (animateToOffset < (-feedItemWidth * ((float)decks.size() - 1.0))) {
        animateToOffset = (-feedItemWidth * ((float)decks.size() - 1.0));
      }

      if (isAnimating) {
        int idx = getCurrentIndex();
        if (idx >= 0 && idx < (int)decks.size() && decks[idx].player) {
          decks[idx].player->suspend();
        }
      }
    }
  });

#ifdef DEBUG_AUTO_ADVANCE
  if (rand() % 100 > 94) {
    offset = -feedItemWidth * (float)(rand() % decks.size());
  }
#endif

  if (isAnimating) {
    offset = smoothstep(animateFromOffset, animateToOffset,
        animationTimeElapsed / SCROLL_ANIMATION_TIME,
        CoreViews::getInstance().getNumConstant("ANIMATION_EASING_FUNCTION"));
    animationTimeElapsed += dt;
    if (animationTimeElapsed >= SCROLL_ANIMATION_TIME) {
      isAnimating = false;
      isTapGestureAnimation = false;
      offset = animateToOffset;

      int newIdx = getCurrentIndex();
      if (newIdx > 0) {
        if (isShowingNux) {
          isShowingNux = false;
          NuxCompletedEvent ev;
          bridge.sendEvent("NUX_COMPLETED", ev);
        }
      }

      sendViewFeedItemEvent();
    }
  }

  int idx = getCurrentIndex();

  if (!dragStarted && !isAnimating) {
    if (idx >= 0 && idx < (int)decks.size() && decks[idx].player) {
      if (decks[idx].player->hasScene()) {
        if (auto nextCardId = decks[idx].player->getScene().getNextCardId(); nextCardId) {
          if (nextCardId == NUX_LAST_CARD_ID) {
            nuxIsHidingControls = false;
            nuxAnimationTime = 0.0;
          }

          if (CARD_ID_TO_DATA.find(*nextCardId) != CARD_ID_TO_DATA.end()) {
            std::string cardData(reinterpret_cast<char *>(CARD_ID_TO_DATA.at(*nextCardId).first),
                CARD_ID_TO_DATA.at(*nextCardId).second);
            auto archive = Archive::fromJson(cardData.c_str());
            archive.read([&](Reader &reader) {
              decks[idx].player->readScene(reader, decks[idx].player->getScene().getDeckId());
            });
          } else {
            API::loadCard(nextCardId->c_str(), true, [=](APIResponse &response) {
              if (response.success && idx == getCurrentIndex() && decks[idx].player) {
                auto reader = response.reader;
                decks[idx].player->readScene(reader, decks[idx].player->getScene().getDeckId());
              }

              // TODO: show error?
            });
          }
          decks[idx].player->getScene().setNextCardId(std::nullopt);
          decks[idx].cardId = nextCardId;
        }
      }

      if (!paused) {
        decks[idx].player->resume();
        runUpdateAtIndex(idx, dt);

        if (decks[idx].deckId && decks[idx].cardId) {
          DeckPlays::getInstance().setDeckAndCardIds(*decks[idx].deckId, *decks[idx].cardId);
        }
        DeckPlays::getInstance().update(dt);
      }

      decks[idx].coreView->update(dt);
      if (!isShowingNux
          && timeSinceLastSwipeGesture
              > CORE_VIEWS_GESTURE_INACTIVE_AFTER_SWIPE_TIME + SCROLL_ANIMATION_TIME
          && !wasLongFrame) {
        decks[idx].coreView->handleGesture(gesture, cardLeft, TOP_PADDING);
      }

      decks[idx].avatarCoreView->update(dt);
      if (!isShowingNux
          && timeSinceLastSwipeGesture
              > CORE_VIEWS_GESTURE_INACTIVE_AFTER_SWIPE_TIME + SCROLL_ANIMATION_TIME
          && !wasLongFrame) {
        decks[idx].avatarCoreView->handleGesture(
            gesture, cardLeft + decks[idx].avatarCoreViewLeft, TOP_PADDING);
      }
    }

    if (idx >= 0 && idx < (int)decks.size() && decks[idx].errorCoreView
        && decks[idx].hasNetworkError) {
      decks[idx].errorCoreView->handleGesture(gesture, cardLeft, TOP_PADDING);
    }

    if (globalErrorCoreView && hasGlobalNetworkError) {
      globalErrorCoreView->handleGesture(gesture, 0, 0);
    }

    for (size_t i = 0; i < decks.size(); i++) {
      if (decks[i].isLoaded && !decks[i].hasRunUpdate) {
        runUpdateAtIndex(idx, dt);
        decks[i].hasRunUpdate = true;

        if (i != (size_t)idx && decks[i].player) {
          decks[i].player->suspend();
        }
      }
    }

    if (decks.size() > 0 && idx > (int)decks.size() - 4) {
      fetchMoreDecks();
    }

    loadDeckAtIndex(idx - 1);
    loadDeckAtIndex(idx);
    loadDeckAtIndex(idx + 1);
    loadDeckAtIndex(idx + 2);

    // load more avatars since you can see the previous/next ones when viewing a deck
    loadAvatarAtIndex(idx - 2);
    loadAvatarAtIndex(idx - 1);
    loadAvatarAtIndex(idx);
    loadAvatarAtIndex(idx + 1);
    loadAvatarAtIndex(idx + 2);
    loadAvatarAtIndex(idx + 3);
  }

  for (int i = idx - 2; i <= idx + 2; i++) {
    if (i >= 0 && i < (int)decks.size()) {
      decks[i].loadingTime += dt;
    }
  }
}

void Feed::runUpdateAtIndex(int idx, double dt) {
  if (!decks[idx].player) {
    return;
  }

  if (decks[idx].isFrozen) {
    // don't run any more updates at this point
    return;
  }

  if (decks[idx].player->hasScene()) {
    decks[idx].player->getScene().getGesture().setBounds(
        cardLeft, TOP_PADDING, cardWidth, cardHeight);
  }

  if (decks[idx].framesToSkip > 1.0) {
    decks[idx].framesToSkip -= 1.0;
    if (decks[idx].framesToSkip < 0.0) {
      decks[idx].framesToSkip = 0.0;
    }
    return;
  }

  if (decks[idx].frameIndex == 0) {
    for (int i = 0; i < NUM_FRAME_TIMES; i++) {
      decks[idx].frameTimes[i] = 0.0;
    }
  }

  double start = lv.timer.getTime();
  decks[idx].player->update(dt);
  double time = lv.timer.getTime() - start;
  decks[idx].hasRunUpdateSinceLastRender = true;

  decks[idx].frameTimes[decks[idx].frameIndex % NUM_FRAME_TIMES] = time;
  decks[idx].frameIndex++;

  if (time > 1.5) {
    decks[idx].isFrozen = true;
  } else if (time > 1.0) {
    decks[idx].framesToSkip += 20.0;
  } else if (time > 0.5) {
    decks[idx].framesToSkip += 5.0;
  } /* else if (time > 0.2) {
     decks[idx].framesToSkip += 1.0;
   }*/

  float avgTime = 0.0;
  for (int i = 0; i < NUM_FRAME_TIMES; i++) {
    avgTime += decks[idx].frameTimes[i];
  }
  avgTime /= (float)NUM_FRAME_TIMES;
  if (avgTime > 0.5) {
    decks[idx].isFrozen = true;
  } else if (avgTime > 1.0 / 30.0) {
    decks[idx].framesToSkip += 20.0;
  } else if (avgTime > 1.0 / 60.0) {
    decks[idx].framesToSkip += 5.0;
  }
}

void Feed::renderCardAtPosition(
    int idx, float position, bool isActive, int focusedIdx, float dragAmount) {
  if (idx < 0) {
    return;
  }

  if (idx >= (int)decks.size()) {
    return;
  }

  bool isDeckVisible = true;
  if (focusedIdx < idx - 1) {
    isDeckVisible = false;
  } else if (focusedIdx != idx && fabs(dragAmount) < 0.01) {
    isDeckVisible = false;
  }

  float padding = (windowWidth - cardWidth) / 2.0;
  float percentFromCenter = fabs((float)(position - padding) / windowWidth);
  percentFromCenter -= 0.15;
  if (percentFromCenter < 0) {
    percentFromCenter = 0.0;
  }

  if (!decks[idx].player || !decks[idx].hasRunUpdate || decks[idx].hasNetworkError) {
    if (isDeckVisible) {
      lv.graphics.push(love::Graphics::STACK_ALL);
      viewTransform.reset();
      viewTransform.translate(position, TOP_PADDING);
      lv.graphics.applyTransform(&viewTransform);

      if (decks[idx].hasNetworkError) {
        elapsedTime = 0.0;
      }

      lv.graphics.setColor({ 1.0, 1.0, 1.0, 1.0 });
      if (decks[idx].hasNetworkError) {
        renderCardTexture(nullptr, 0.0, 1.0);
        decks[idx].errorCoreView->render();
      } else {
        renderCardTexture(nullptr, elapsedTime, 1.0);
      }

      lv.graphics.pop();
    }
  } else {
    bool shouldDraw = isActive;

    if (!decks[idx].hasRendered) {
      decks[idx].hasRendered = true;
      shouldDraw = true;
    } else if (!decks[idx].hasRunUpdateSinceLastRender) {
      shouldDraw = false;
    }

    auto canvas = canvasForIndex(idx);
    if (!canvas) {
      return;
    }

    if (shouldDraw) {
      renderToCanvas(canvas, [&]() {
        lv.graphics.push(love::Graphics::STACK_ALL);
        viewTransform.reset();
        viewTransform.scale(cardWidth / 800.0, cardHeight / 1120.0);
        lv.graphics.applyTransform(&viewTransform);
        lv.graphics.setColor({ 1.0, 1.0, 1.0, 1.0 });
        decks[idx].player->draw();
        lv.graphics.pop();
      });

      decks[idx].hasRunUpdateSinceLastRender = false;
    }

    lv.graphics.push(love::Graphics::STACK_ALL);
    viewTransform.reset();
    viewTransform.translate(position, TOP_PADDING);
    lv.graphics.applyTransform(&viewTransform);
    lv.graphics.setColor({ 1, 1, 1, 1 });

    if (isDeckVisible) {
      renderCardTexture(canvas, elapsedTime, decks[idx].isFrozen ? 0.5 : 1.0);
    }

    lv.graphics.pop();
  }

  lv.graphics.push(love::Graphics::STACK_ALL);
  viewTransform.reset();
  viewTransform.translate(position, TOP_PADDING);
  lv.graphics.applyTransform(&viewTransform);
  lv.graphics.setColor({ 1.0, 1.0, 1.0, 1.0f - (percentFromCenter * 0.5f) });

  if (isShowingNux && idx > 0) {
    lv.graphics.setColor(
        { 1.0, 1.0, 1.0, (1.0f - (percentFromCenter * 0.5f)) * (1.0f - nuxAlpha) });
  }

  if (isShowingNux && idx == 0) {
    lv.graphics.setColor({ 1.0, 1.0, 1.0, (1.0f - (percentFromCenter * 0.5f)) * nuxControlsAlpha });
  }

  if (isDeckVisible) {
    if (decks[idx].coreView) {
      decks[idx].coreView->render();
    }
  }

  if (decks[idx].avatarCoreView) {
    float left = 6.5 * (float)cardWidth / 100.0;
    float avatarWidth = 6.4 * (float)cardWidth / 100.0;
    float percent = fabs(1.0 + dragAmount);
    float moveAwayPercent = 0.05;

    float animateLeft = left;
    if (idx == focusedIdx - 1) {
      // icon on left and swiping right
      if (percent >= 1) {
        percent = 2.0 - percent;
        left -= windowWidth * moveAwayPercent;
        animateLeft = cardWidth + padding - avatarWidth / 2.0;
      }
      // icon was previous main, becoming new left
      else {
        animateLeft = cardWidth + padding - avatarWidth / 2.0;
      }
    } else if (idx == focusedIdx) {
      // icon is main, becoming new left
      if (percent > 1.0) {
        percent -= 1.0;
        animateLeft = cardWidth + padding - avatarWidth / 2.0;
      }
      // icon is main, becoming new right
      else {
        percent = 1.0 - percent;
        animateLeft = -padding - avatarWidth / 2.0;
      }
    } else if (idx == focusedIdx + 1) {
      // icon on right and swiping left
      if (percent <= 1.0) {
        left += windowWidth * moveAwayPercent;
        animateLeft = -padding - avatarWidth / 2.0;
      }
      // icon on right and swiping right
      else {
        percent = 2.0 - percent;
        animateLeft = -padding - avatarWidth / 2.0;
      }
    }

    percent = cubicEaseIn(percent);

    left = animateLeft * percent + left * (1.0 - percent);
    decks[idx].avatarCoreViewLeft = left;

    lv.graphics.translate(left, 0.0);
    decks[idx].avatarCoreView->render();
  }

  lv.graphics.pop();
}

void Feed::renderCardTexture(love::Texture *texture, float time, float brightness) {
  static auto quad = [&]() {
    std::vector<love::graphics::Vertex> quadVerts {
      { 0, 0, 0, 0, { 0xff, 0xff, 0xff, 0xff } },
      { 1, 0, 1, 0, { 0xff, 0xff, 0xff, 0xff } },
      { 1, 1, 1, 1, { 0xff, 0xff, 0xff, 0xff } },
      { 0, 1, 0, 1, { 0xff, 0xff, 0xff, 0xff } },
    };
    return lv.graphics.newMesh(
        quadVerts, love::graphics::PRIMITIVE_TRIANGLE_FAN, love::graphics::vertex::USAGE_STATIC);
  }();

  auto currentShader = texture ? shader.get() : loadingShader.get();
  lv.graphics.setShader(currentShader);

  {
    auto info = currentShader->getUniformInfo("radius");
    info->floats[0] = CoreViews::getInstance().getNumConstant("CARD_BORDER_RADIUS");
    currentShader->updateUniform(info, 1);
  }

  {
    auto info = currentShader->getUniformInfo("width");
    info->floats[0] = cardWidth;
    currentShader->updateUniform(info, 1);
  }

  {
    auto info = currentShader->getUniformInfo("height");
    info->floats[0] = cardHeight;
    currentShader->updateUniform(info, 1);
  }

  if (texture) {
    auto info = currentShader->getUniformInfo("brightness");
    info->floats[0] = brightness;
    currentShader->updateUniform(info, 1);
  } else {
    auto info = currentShader->getUniformInfo("time");
    info->floats[0] = time;
    currentShader->updateUniform(info, 1);
  }

  quad->setTexture(texture);
  quad->draw(&lv.graphics, love::Matrix4(0.0, 0.0, 0, cardWidth, cardHeight, 0, 0, 0, 0));
  quad->setTexture(nullptr);
  lv.graphics.setShader();
}

void Feed::makeShader() {
  static const char vert[] = R"(
    vec4 position(mat4 transformProjection, vec4 vertexPosition) {
      return transformProjection * vertexPosition;
    }
  )";
  static const char frag[] = R"(
    uniform float radius;
    uniform float width;
    uniform float height;
    uniform float brightness;

    vec4 effect(vec4 color, Image tex, vec2 texCoords, vec2 screenCoords) {
      float x = texCoords.x * width;
      float y = texCoords.y * height;
      vec2 coord = vec2(x, y);

      if (x < radius && y < radius && distance(coord, vec2(radius, radius)) > radius) {
        discard;
      }

      if (x < radius && y > height - radius && distance(coord, vec2(radius, height - radius)) > radius) {
        discard;
      }

      if (x > width - radius && y < radius && distance(coord, vec2(width - radius, radius)) > radius) {
        discard;
      }

      if (x > width - radius && y > height - radius && distance(coord, vec2(width - radius, height - radius)) > radius) {
        discard;
      }

      vec4 result = Texel(tex, texCoords);
      return color * vec4(result.r * brightness, result.g * brightness, result.b * brightness, result.a);
    }
  )";
  shader.reset(
      lv.graphics.newShader(lv.wrapVertexShaderCode(vert), lv.wrapFragmentShaderCode(frag)));

  static const char loadingFrag[] = R"(
    uniform float radius;
    uniform float width;
    uniform float height;
    uniform float time;

    vec4 effect(vec4 color, Image tex, vec2 texCoords, vec2 screenCoords) {
      float x = texCoords.x * width;
      float y = texCoords.y * height;
      vec2 coord = vec2(x, y);

      if (x < radius && y < radius && distance(coord, vec2(radius, radius)) > radius) {
        discard;
      }

      if (x < radius && y > height - radius && distance(coord, vec2(radius, height - radius)) > radius) {
        discard;
      }

      if (x > width - radius && y < radius && distance(coord, vec2(width - radius, radius)) > radius) {
        discard;
      }

      if (x > width - radius && y > height - radius && distance(coord, vec2(width - radius, height - radius)) > radius) {
        discard;
      }

      return color * vec4(0.15, 0.15, 0.15, 0.75 + cos(time * 4.0) * 0.25);
    }
  )";
  loadingShader.reset(
      lv.graphics.newShader(lv.wrapVertexShaderCode(vert), lv.wrapFragmentShaderCode(loadingFrag)));
}

void Feed::draw() {
  if (!hasSetWindowSize) {
    return;
  }

  if (!shader) {
    makeShader();
  }

  if (hasGlobalNetworkError) {
    globalErrorCoreView->render();
    return;
  }

  float padding = (windowWidth - cardWidth) / 2.0;

  if (decks.size() == 0) {
    lv.graphics.push(love::Graphics::STACK_ALL);
    viewTransform.reset();
    viewTransform.translate(padding, TOP_PADDING);
    lv.graphics.applyTransform(&viewTransform);
    lv.graphics.setColor({ 1.0, 1.0, 1.0, 1.0 });
    renderCardTexture(nullptr, elapsedTime, 1.0);
    lv.graphics.pop();
    return;
  }

  int idx = getCurrentIndex();
  float dragAmount = getDragAmount();

  renderCardAtPosition(
      idx - 1, offset + feedItemWidth * (idx - 1) + padding, false, idx, dragAmount);
  renderCardAtPosition(
      idx, offset + feedItemWidth * idx + padding, !dragStarted && !isAnimating, idx, dragAmount);
  renderCardAtPosition(
      idx + 1, offset + feedItemWidth * (idx + 1) + padding, false, idx, dragAmount);
  renderCardAtPosition(
      idx + 2, offset + feedItemWidth * (idx + 2) + padding, false, idx, dragAmount);

  if (isShowingNux && !nuxIsHidingControls) {
    renderNux();
  } else {
    nuxCoreView.reset();
  }

  // this releases a canvas, so we want to run it in render
  for (int i = 0; i <= idx - 2; i++) {
    unloadDeckAtIndex(i);
  }

  for (int i = idx + 3; i < (int)decks.size(); i++) {
    unloadDeckAtIndex(i);
  }

  for (int i = 0; i <= idx - 3; i++) {
    unloadAvatarAtIndex(i);
  }

  for (int i = idx + 4; i < (int)decks.size(); i++) {
    unloadAvatarAtIndex(i);
  }
}

void Feed::showNux() {
  if (isShowingNux) {
    return;
  }

  isShowingNux = true;
  nuxIsHidingControls = true;
  nuxAnimationTime = 0.0;
  // probably don't need this. just want to guard against the case where a deep link
  // shifted the offset to the next deck
  offset = 0.0;

  int idx = getCurrentIndex();
  if (idx >= 0 && idx < (int)decks.size()) {
    if (decks[idx].coreView) {
      decks[idx].coreView->cancelGestures();
    }

    if (decks[idx].avatarCoreView) {
      decks[idx].avatarCoreView->cancelGestures();
    }
  }

  FeedItem feedItem;
  std::string introDeckId = NUX_DECK_ID;
  feedItem.deckJson = std::string(reinterpret_cast<char *>(DECK_ID_TO_DATA.at(introDeckId).first),
      DECK_ID_TO_DATA.at(introDeckId).second);
  decks.insert(decks.begin(), 1, std::move(feedItem));
}

void Feed::showNativeFeedNux() {
  if (isShowingNux) {
    return;
  }

  isShowingNux = true;
  nuxAnimationTime = 0.0;
  // probably don't need this. just want to guard against the case where a deep link
  // shifted the offset to the next deck
  offset = 0.0;

  int idx = getCurrentIndex();
  if (idx >= 0 && idx < (int)decks.size()) {
    if (decks[idx].coreView) {
      decks[idx].coreView->cancelGestures();
    }

    if (decks[idx].avatarCoreView) {
      decks[idx].avatarCoreView->cancelGestures();
    }
  }
}

void Feed::renderNux() {
  if (!nuxCoreView) {
    nuxCoreView = CoreViews::getInstance().getRenderer("FEED_NUX", windowWidth, windowHeight);
    nuxCoreView->updateProp("container", "top", std::to_string(cardHeight));
    nuxCoreView->updateProp("container", "height", std::to_string(windowHeight - cardHeight));
  }

  float perc = cubicEaseInOut(fmod(nuxAnimationTime, NUX_ANIMATION_TIME) / NUX_ANIMATION_TIME);
  float x = (float)windowWidth - ((float)windowWidth * 1.6) * perc;

  lv.graphics.push(love::Graphics::STACK_ALL);
  viewTransform.reset();
  viewTransform.translate(x, 0.0);
  lv.graphics.applyTransform(&viewTransform);
  lv.graphics.setColor({ 1.0, 1.0, 1.0, nuxAlpha });

  nuxCoreView->render();

  lv.graphics.pop();
}

void Feed::suspend() {
  paused = true;
  int idx = getCurrentIndex();
  if (idx >= 0 && idx < (int)decks.size() && decks[idx].player) {
    decks[idx].player->suspend();
  }
}

void Feed::resume() {
  paused = false;
  int idx = getCurrentIndex();
  if (idx >= 0 && idx < (int)decks.size() && decks[idx].player) {
    decks[idx].player->resume();
  }
}

void Feed::clearState() {
}

void Feed::setDeepLinkDeckId(std::string deckId) {
  if (deckId == deepLinkDeckId) {
    return;
  }

  deepLinkDeckId = deckId;

  int idx = 0;
  if (decks.size() > 0) {
    idx = getCurrentIndex() + 1;
    if (idx < 0) {
      idx = 0;
    }

    if (idx > decks.size()) {
      idx = decks.size();
    }

    if (!isShowingNux) {
      offset -= cardWidth;
    }
  }

  FeedItem feedItem;
  feedItem.deckId = deckId;
  decks.insert(decks.begin() + idx, std::move(feedItem));
  seenDeckIds.insert(deckId);

  // indexes moved, so cancel loading all decks
  for (size_t i = 0; i < decks.size(); i++) {
    if (i != idx) {
      unloadDeckAtIndex(i, true);
    }
  }
}

void Feed::fetchInitialDecks(std::vector<std::string> deckIds, int initialDeckIndex_,
    std::optional<std::string> paginateFeedId_, bool isNuxCompleted,
    bool isNativeFeedNuxCompleted) {
  initialDeckIndex = initialDeckIndex_;
  paginateFeedId = paginateFeedId_;

  if (deckIds.size() > 0) {
    usingFixedDecksList = true;
    for (size_t i = 0; i < deckIds.size(); i++) {
      FeedItem feedItem;
      feedItem.deckId = deckIds[i];
      decks.push_back(std::move(feedItem));
      seenDeckIds.insert(deckIds[i]);
    }
  } else {
    if (!isNuxCompleted) {
      showNux();
    } else if (!isNativeFeedNuxCompleted) {
      showNativeFeedNux();
    }

    usingFixedDecksList = false;
    fetchingDecks = true;
    API::graphql("{\n  infiniteFeedV2(limit: 1) {\n    sessionId\n    decks {" + GRAPHQL_DECK_FIELDS
            + "}\n  }\n}",
        [=](APIResponse &response) {
          if (response.success) {
            auto &reader = response.reader;

            reader.obj("data", [&]() {
              reader.obj("infiniteFeedV2", [&]() {
                sessionId = reader.str("sessionId", "");

                reader.arr("decks", [&]() {
                  reader.each([&]() {
                    std::string deckId = reader.str("deckId", "");

                    FeedItem feedItem;
                    feedItem.deckJson = reader.toJson();
                    seenDeckIds.insert(deckId);
                    decks.push_back(std::move(feedItem));
                  });
                });
              });
            });

            fetchingDecks = false;
          } else {
            globalErrorCoreView
                = CoreViews::getInstance().getRenderer("FEED_ERROR", windowWidth, windowHeight);
            globalErrorCoreView->updateProp("error-text", "text", "Error loading feed");
            globalErrorCoreView->registerTapHandler([this](std::string id) {
              if (id == "reload-icon") {
                hasGlobalNetworkError = false;
                fetchingDecks = false;
                std::vector<std::string> deckIds;
                fetchInitialDecks(deckIds, 0, std::nullopt);
              }
            });
            hasGlobalNetworkError = true;
          }
        });
  }
}

void Feed::fetchMoreDecks() {
  if (fetchingDecks || (usingFixedDecksList && !paginateFeedId) || lastFeedPageWasEmpty) {
    return;
  }

  if (!isCurrentDeckLoaded()) {
    return;
  }

  if (paginateFeedId) {
    if (decks.size() == 0) {
      return;
    }

    auto lastModifiedBefore = decks[decks.size() - 1].lastModified;
    if (!lastModifiedBefore) {
      // last deck might be an error screen
      if (decks[decks.size() - 1].hasNetworkError && !decks[decks.size() - 1].deckId
          && decks.size() > 1) {
        lastModifiedBefore = decks[decks.size() - 2].lastModified;
      }

      if (!lastModifiedBefore) {
        return;
      }
    }

    fetchingDecks = true;
    API::graphql("{\n  paginateFeed(feedId: \"" + *paginateFeedId + "\", lastModifiedBefore: \""
            + *lastModifiedBefore + "\") {\n" + GRAPHQL_DECK_FIELDS + "}\n}",
        [=](APIResponse &response) {
          if (response.success) {
            removeLoadMoreDecksError();
            auto &reader = response.reader;

            reader.obj("data", [&]() {
              reader.arr("paginateFeed", [&]() {
                bool hasDeck = false;
                reader.each([&]() {
                  std::string deckId = reader.str("deckId", "");

                  if (seenDeckIds.find(deckId) == seenDeckIds.end()) {
                    hasDeck = true;
                    FeedItem feedItem;
                    feedItem.deckJson = reader.toJson();
                    seenDeckIds.insert(deckId);
                    decks.push_back(std::move(feedItem));
                  }
                });

                if (!hasDeck) {
                  lastFeedPageWasEmpty = true;
                }
              });
            });

            fetchingDecks = false;
          } else {
            loadMoreDecksError();
          }
        });
  } else {
    fetchingDecks = true;

    API::graphql("{\n  infiniteFeedV2(sessionId: \"" + sessionId + "\") {\n    decks {"
            + GRAPHQL_DECK_FIELDS + "}\n  }\n}",
        [=](APIResponse &response) {
          if (response.success) {
            removeLoadMoreDecksError();
            auto &reader = response.reader;

            reader.obj("data", [&]() {
              reader.obj("infiniteFeedV2", [&]() {
                reader.arr("decks", [&]() {
                  reader.each([&]() {
                    std::string deckId = reader.str("deckId", "");

                    if (seenDeckIds.find(deckId) == seenDeckIds.end()) {
                      FeedItem feedItem;
                      feedItem.deckJson = reader.toJson();
                      seenDeckIds.insert(deckId);
                      decks.push_back(std::move(feedItem));
                    }
                  });
                });
              });
            });

            fetchingDecks = false;
          } else {
            loadMoreDecksError();
          }
        });
  }
}

void Feed::loadDeckAtIndex(int i) {
  if (i >= (int)decks.size() || i < 0) {
    return;
  }

  if (decks[i].player || decks[i].isLoading) {
    return;
  }

  if (i != getCurrentIndex() && !isCurrentDeckLoaded()) {
    return;
  }

  decks[i].isLoading = true;

  if (decks[i].deckJson) {
    loadDeckFromDeckJson(i);
    decks[i].isLoading = false;
  } else {
    decks[i].loadingTime = 0.0;
    auto deckId = *decks[i].deckId;
    API::graphql("{\n  deck(deckId: \"" + deckId + "\") {\n" + GRAPHQL_DECK_FIELDS + "\n}\n}",
        [i, deckId, this](APIResponse &response) {
          if (decks[i].deckId != deckId) {
            return;
          }

          if (response.success) {
            auto &reader = response.reader;

            reader.obj("data", [&]() {
              reader.obj("deck", [&]() {
                // this will get loaded by loadDeckAtIndex on the main thread
                decks[i].deckJson = reader.toJson();
                decks[i].isLoading = false;
              });
            });
          } else {
            networkErrorAtIndex(i);
          }
        });
  }
}

void Feed::loadAvatarAtIndex(int i) {
  if (i >= (int)decks.size() || i < 0) {
    return;
  }

  if (decks[i].avatarCoreView || !decks[i].deckJson) {
    return;
  }

  if (!decks[i].avatarUrl || !decks[i].creatorUserId) {
    auto deckArchive = Archive::fromJson(decks[i].deckJson->c_str());
    deckArchive.read([&](Reader &reader) {
      reader.obj("creator", [&]() {
        decks[i].creatorUserId = reader.str("userId", "");
        reader.obj("photo", [&]() {
          decks[i].avatarUrl = reader.str("smallAvatarUrl", DEFAULT_AVATAR_URL);
        });
      });
    });
  }

  decks[i].avatarCoreView
      = CoreViews::getInstance().getRenderer("FEED_AVATAR", cardWidth, windowHeight - cardHeight);
  decks[i].avatarCoreView->updateProp("container", "top", std::to_string(cardHeight));
  decks[i].avatarCoreView->updateProp(
      "container", "height", std::to_string(windowHeight - cardHeight));
  decks[i].avatarCoreView->updateProp("container", "width", std::to_string(cardWidth));
  decks[i].avatarCoreView->updateJSGestureProp("userId", *decks[i].creatorUserId);
  decks[i].avatarCoreView->updateProp("avatar", "url", *decks[i].avatarUrl);
}

void Feed::unloadAvatarAtIndex(int i) {
  if (i >= (int)decks.size() || i < 0) {
    return;
  }

  decks[i].avatarCoreView.reset();
}

void Feed::layoutCoreViews(int i) {
  if (!decks[i].coreView) {
    // This can happen if there is an error loading the scenedata
    return;
  }

  float FEED_BOTTOM_ACTIONS_INITIAL_RIGHT
      = CoreViews::getInstance().getNumConstant("FEED_BOTTOM_ACTIONS_INITIAL_RIGHT");
  float FEED_BOTTOM_ACTIONS_TEXT_RIGHT_PADDING
      = CoreViews::getInstance().getNumConstant("FEED_BOTTOM_ACTIONS_TEXT_RIGHT_PADDING");
  float FEED_BOTTOM_ACTIONS_REACTION_ICON_RIGHT_PADDING
      = CoreViews::getInstance().getNumConstant("FEED_BOTTOM_ACTIONS_REACTION_ICON_RIGHT_PADDING");
  float FEED_BOTTOM_ACTIONS_COMMENT_ICON_RIGHT_PADDING
      = CoreViews::getInstance().getNumConstant("FEED_BOTTOM_ACTIONS_COMMENT_ICON_RIGHT_PADDING");
  float FEED_BOTTOM_ACTIONS_SPACE_REACTION_BUTTON_AND_TEXT
      = CoreViews::getInstance().getNumConstant(
          "FEED_BOTTOM_ACTIONS_SPACE_REACTION_BUTTON_AND_TEXT");
  float FEED_BOTTOM_ACTIONS_SPACE_COMMENT_BUTTON_AND_TEXT = CoreViews::getInstance().getNumConstant(
      "FEED_BOTTOM_ACTIONS_SPACE_COMMENT_BUTTON_AND_TEXT");
  float FEED_BOTTOM_ACTIONS_MAX_DIFF_BEFORE_REACTION_RELAYOUT
      = CoreViews::getInstance().getNumConstant(
          "FEED_BOTTOM_ACTIONS_MAX_DIFF_BEFORE_REACTION_RELAYOUT");

  float vw = cardWidth / 100.0;
  int currentRight = FEED_BOTTOM_ACTIONS_INITIAL_RIGHT * vw;

  auto reactionCount = decks[i].coreView->getProp("reaction-count", "text");
  if (reactionCount.empty() || reactionCount == "0") {
    decks[i].coreView->updateProp("reaction-count", "visibility", "hidden");
    currentRight += FEED_BOTTOM_ACTIONS_REACTION_ICON_RIGHT_PADDING * vw;
  } else {
    int reactionCountWidth = decks[i].coreView->getView("reaction-count").getContentWidth()
        + FEED_BOTTOM_ACTIONS_TEXT_RIGHT_PADDING * vw;
    decks[i].coreView->updateProp("reaction-count", "visibility", "visible");

    auto oldReactionCountWidthStr = decks[i].coreView->getProp("reaction-count", "width");
    int oldReactionCountWidth = FormatNumber::isInt(oldReactionCountWidthStr)
        ? std::stoi(oldReactionCountWidthStr)
        : 1000000;
    auto oldReactionCountRightStr = decks[i].coreView->getProp("reaction-count", "right");
    int oldReactionCountRight = FormatNumber::isInt(oldReactionCountRightStr)
        ? std::stoi(oldReactionCountRightStr)
        : 1000000;

    if (abs(oldReactionCountWidth - reactionCountWidth)
            > FEED_BOTTOM_ACTIONS_MAX_DIFF_BEFORE_REACTION_RELAYOUT * vw
        || abs(oldReactionCountRight - currentRight)
            > FEED_BOTTOM_ACTIONS_MAX_DIFF_BEFORE_REACTION_RELAYOUT * vw) {
      decks[i].coreView->updateProp("reaction-count", "width", std::to_string(reactionCountWidth));
      decks[i].coreView->updateProp("reaction-count", "right", std::to_string(currentRight), true);
      currentRight += reactionCountWidth;
    } else {
      currentRight += oldReactionCountWidth;
    }
    currentRight += FEED_BOTTOM_ACTIONS_SPACE_REACTION_BUTTON_AND_TEXT * vw;
  }

  decks[i].coreView->updateProp("reaction-icon", "right", std::to_string(currentRight));
  currentRight += 5.5 * vw;

  if (decks[i].coreView->getProp("comment-count", "text") == "0") {
    decks[i].coreView->updateProp("comment-count", "visibility", "hidden");
    currentRight += FEED_BOTTOM_ACTIONS_COMMENT_ICON_RIGHT_PADDING * vw;
  } else {
    int commentCountWidth = decks[i].coreView->getView("comment-count").getContentWidth()
        + FEED_BOTTOM_ACTIONS_TEXT_RIGHT_PADDING * vw;
    decks[i].coreView->updateProp("comment-count", "visibility", "visible");
    decks[i].coreView->updateProp("comment-count", "width", std::to_string(commentCountWidth));
    decks[i].coreView->updateProp("comment-count", "right", std::to_string(currentRight), true);
    currentRight += commentCountWidth;
    currentRight += FEED_BOTTOM_ACTIONS_SPACE_COMMENT_BUTTON_AND_TEXT * vw;
  }

  decks[i].coreView->updateProp("comment-icon", "right", std::to_string(currentRight));
}

void Feed::loadDeckFromDeckJson(int i) {
  decks[i].player = std::make_shared<Player>(bridge);
  decks[i].coreView
      = CoreViews::getInstance().getRenderer("FEED", cardWidth, windowHeight - cardHeight);
  decks[i].coreView->updateProp("container", "top", std::to_string(cardHeight));
  decks[i].coreView->updateProp("container", "height", std::to_string(windowHeight - cardHeight));
  decks[i].coreView->updateProp("container", "width", std::to_string(cardWidth));
  decks[i].coreView->registerTapHandler([i, this](std::string id) {
    if (id == "reaction-icon" || id == "reaction-count") {
      decks[i].isCurrentUserReactionToggled
          = decks[i].isCurrentUserReactionToggled == FeedItem::True ? FeedItem::False
                                                                    : FeedItem::True;
      if (decks[i].deckId) {
        API::graphql("mutation {\n  toggleReaction(reactionId: \"fire\", deckId: \""
                + *decks[i].deckId + "\", enabled: "
                + (decks[i].isCurrentUserReactionToggled == FeedItem::True ? "true" : "false")
                + ") {\nid\n}\n}",
            [=](APIResponse &response) {
            });
      }

      if (decks[i].isCurrentUserReactionToggled == FeedItem::True) {
        (*decks[i].reactionCount)++;
      } else {
        (*decks[i].reactionCount)--;
      }
      decks[i].coreView->updateProp(
          "reaction-count", "text", FormatNumber::toString(*decks[i].reactionCount));
      layoutCoreViews(i);

      decks[i].coreView->runAnimation("reaction-icon", "scale", 0.3, [i, this](float amount) {
        if (amount > 0.35 && decks[i].coreView) {
          if (decks[i].isCurrentUserReactionToggled == FeedItem::True) {
            decks[i].coreView->updateProp("reaction-icon", "filename", "fire-selected.png");
          } else {
            decks[i].coreView->updateProp("reaction-icon", "filename", "fire.png");
          }
        }

        amount = 0.5 - fabs(amount - 0.5);
        return std::to_string(1.0 + amount * 0.5);
      });
    }
  });

  auto deckArchive = Archive::fromJson(decks[i].deckJson->c_str());
  deckArchive.read([&](Reader &reader) {
    std::string deckId = reader.str("deckId", "");
    decks[i].deckId = deckId;
    decks[i].visibility = reader.str("visibility");
    decks[i].lastModified = reader.str("lastModified");
    decks[i].coreView->updateJSGestureProp("deckId", deckId);
    decks[i].coreView->updateJSGestureProp("deck", *decks[i].deckJson);

#ifdef CAPTIONS_ENABLED
    decks[i].coreView->updateProp("caption", "text", reader.str("caption", ""));
#endif

    reader.arr("variables", [&]() {
      decks[i].player->readVariables(reader);
    });

    reader.obj("creator", [&]() {
      decks[i].coreView->updateProp("username", "text", reader.str("username", ""));
      decks[i].creatorUserId = reader.str("userId", "");
      decks[i].coreView->updateJSGestureProp("userId", *decks[i].creatorUserId);
    });

    /*int childDecksCount = reader.num("childDecksCount", 0);
    if (childDecksCount > 0) {
      decks[i].coreView->updateProp("remix-count", "text", FormatNumber::toString(childDecksCount));
      decks[i].coreView->updateProp("remix-icon", "visibility", "visible");
      decks[i].coreView->updateProp("remix-count", "visibility", "visible");
    }*/

    if (reader.has("parentDeck")) {
      reader.obj("parentDeck", [&]() {
        reader.obj("creator", [&]() {
          auto parentDeckCreatorUsername = reader.str("username");
          if (parentDeckCreatorUsername) {
            decks[i].coreView->updateProp("remix-icon", "visibility", "visible");
            decks[i].coreView->updateProp("remix-text", "text",
                "Remix of " + std::string(*parentDeckCreatorUsername) + "'s deck");
            decks[i].coreView->updateProp("remix-text", "visibility", "visible");
          }
        });
      });
    }

    bool commentsEnabled = reader.boolean("commentsEnabled", false);
    decks[i].coreView->updateJSGestureProp("commentsEnabled", commentsEnabled ? "true" : "false");
    if (commentsEnabled) {
      reader.obj("comments", [&]() {
        int count = reader.num("count", 0);
        if (count > 0) {
          decks[i].coreView->updateProp("comment-count", "text", FormatNumber::toString(count));
        }
      });
    }

    reader.arr("reactions", [&]() {
      bool foundReaction = false;

      reader.each([&]() {
        foundReaction = true;
        std::string reactionId = reader.str("reactionId", "");

        if (reactionId == "fire") {
          if (!decks[i].reactionCount) {
            decks[i].reactionCount = reader.num("count", 0);
          }

          int count = *decks[i].reactionCount;
          decks[i].coreView->updateProp("reaction-count", "text", FormatNumber::toString(count));

          if (decks[i].isCurrentUserReactionToggled == FeedItem::Unset) {
            bool isCurrentUserToggled = reader.boolean("isCurrentUserToggled", false);
            decks[i].isCurrentUserReactionToggled
                = isCurrentUserToggled ? FeedItem::True : FeedItem::False;
          }

          if (decks[i].isCurrentUserReactionToggled == FeedItem::True) {
            decks[i].coreView->updateProp("reaction-icon", "filename", "fire-selected.png");
          }
        }
      });

      // Server doesn't send back fire at all if no reactions
      if (!foundReaction) {
        if (!decks[i].reactionCount) {
          decks[i].reactionCount = 0;
        }

        int count = *decks[i].reactionCount;
        decks[i].coreView->updateProp("reaction-count", "text", FormatNumber::toString(count));

        if (decks[i].isCurrentUserReactionToggled == FeedItem::Unset) {
          decks[i].isCurrentUserReactionToggled = FeedItem::False;
        }

        if (decks[i].isCurrentUserReactionToggled == FeedItem::True) {
          decks[i].coreView->updateProp("reaction-icon", "filename", "fire-selected.png");
        }
      }
    });

    reader.obj("initialCard", [&]() {
      auto cardId = reader.str("cardId", "");
      decks[i].cardId = cardId;

      if (CARD_ID_TO_DATA.find(cardId) != CARD_ID_TO_DATA.end()) {
        std::string cardData(reinterpret_cast<char *>(CARD_ID_TO_DATA.at(cardId).first),
            CARD_ID_TO_DATA.at(cardId).second);
        auto archive = Archive::fromJson(cardData.c_str());
        archive.read([&](Reader &reader) {
          decks[i].player->readScene(reader, deckId);
          decks[i].isLoaded = true;
        });
      } else {
        auto sceneDataUrl = reader.str("sceneDataUrl", "");
        API::loadSceneData(sceneDataUrl, [i, deckId, this](APIResponse &response) {
          if (decks[i].deckId != deckId) {
            return;
          }

          if (response.success) {
            if (decks[i].player) {
              const std::string readerJson = response.reader.toJson();
              decks[i].player->readScene(readerJson, deckId);
              decks[i].isLoaded = true;
            }
          } else {
            networkErrorAtIndex(i);
          }
        });
      }
    });
  });

  layoutCoreViews(i);

  sendViewFeedItemEvent();
}

void Feed::networkErrorAtIndex(int i) {
  decks[i].isLoading = true;
  decks[i].errorCoreView
      = CoreViews::getInstance().getRenderer("FEED_ERROR", cardWidth, cardHeight);
  decks[i].errorCoreView->updateProp("error-text", "text", "Error loading deck");
  decks[i].errorCoreView->registerTapHandler([i, this](std::string id) {
    if (id == "reload-icon") {
      unloadDeckAtIndex(i, true);
      decks[i].hasNetworkError = false;
      decks[i].isLoading = false;
      // loadDeckAtIndex will get called in update
      // would be nice to clean up errorCoreView, but can't do it here
      // decks[i].errorCoreView.reset();
    }
  });
  decks[i].hasNetworkError = true;
}

void Feed::loadMoreDecksError() {
  if (decks.size() > 0) {
    int lastIdx = decks.size() - 1;
    if (decks[lastIdx].hasNetworkError && !decks[lastIdx].deckId) {
      return;
    }
  }

  FeedItem feedItem;
  feedItem.isLoading = true;
  feedItem.errorCoreView
      = CoreViews::getInstance().getRenderer("FEED_ERROR", cardWidth, cardHeight);
  feedItem.errorCoreView->updateProp("error-text", "text", "Error loading more decks");
  feedItem.errorCoreView->registerTapHandler([this](std::string id) {
    if (id == "reload-icon") {
      fetchingDecks = false;
    }
  });
  feedItem.hasNetworkError = true;
  decks.push_back(std::move(feedItem));
}

void Feed::removeLoadMoreDecksError() {
  if (decks.size() > 0) {
    int lastIdx = decks.size() - 1;
    if (decks[lastIdx].hasNetworkError && !decks[lastIdx].deckId) {
      decks.erase(decks.begin() + lastIdx);
    }
  }
}

void Feed::unloadDeckAtIndex(int i, bool force) {
  if (i >= (int)decks.size() || i < 0) {
    return;
  }

  if (!force) {
    if (!decks[i].player) {
      return;
    }

    // don't unload a deck that's in the middle of loading
    if (!decks[i].isLoaded || !decks[i].hasRunUpdate || !decks[i].hasRendered) {
      return;
    }
  }

  decks[i].isLoading = false;
  decks[i].isLoaded = false;
  decks[i].hasRunUpdate = false;
  decks[i].hasRunUpdateSinceLastRender = false;
  decks[i].hasRendered = false;
  decks[i].frameIndex = 0;
  decks[i].framesToSkip = 0.0;
  decks[i].isFrozen = false;
  decks[i].player.reset();
  decks[i].coreView.reset();
}

love::graphics::Canvas *Feed::newCanvas(int width, int height) {
  love::graphics::Canvas::Settings settings;
  settings.width = width;
  settings.height = height;
  settings.dpiScale = 1;
  // settings.msaa = 4;

  return lv.graphics.newCanvas(settings);
}

void Feed::renderToCanvas(love::graphics::Canvas *canvas, const std::function<void()> &lambda) {
  love::graphics::Graphics::RenderTarget rt(canvas);

  love::graphics::Graphics::RenderTargets oldtargets = lv.graphics.getCanvas();

  for (auto c : oldtargets.colors)
    c.canvas->retain();

  if (oldtargets.depthStencil.canvas != nullptr)
    oldtargets.depthStencil.canvas->retain();

  lv.graphics.setCanvas(rt, false);

  lambda();

  lv.graphics.setCanvas(oldtargets);

  for (auto c : oldtargets.colors)
    c.canvas->release();

  if (oldtargets.depthStencil.canvas != nullptr)
    oldtargets.depthStencil.canvas->release();
}

struct ViewFeedItemEvent {
  PROP(std::string, deckId);
  PROP(std::string, visibility);
  PROP(int, index);
};

void Feed::sendViewFeedItemEvent() {
  int idx = getCurrentIndex();

  if (idx != lastViewFeedItemEventIndex && idx >= 0 && idx < (int)decks.size() && decks[idx].deckId
      && decks[idx].visibility) {
    ViewFeedItemEvent ev;
    ev.deckId = *decks[idx].deckId;
    ev.visibility = *decks[idx].visibility;
    ev.index = idx;
    bridge.sendEvent("VIEW_FEED_ITEM", ev);
    lastViewFeedItemEventIndex = idx;
  }
}

love::graphics::Canvas *Feed::canvasForIndex(int i) {
  if (!canvases[i % 4]) {
    canvases[i % 4] = std::shared_ptr<love::graphics::Canvas>(newCanvas(cardWidth, cardHeight));
    if (((love::graphics::opengl::Canvas *)canvases[i % 4].get())->getStatus()
        != GL_FRAMEBUFFER_COMPLETE) {
      canvases[i % 4].reset();
      return nullptr;
    }
  }

  return canvases[i % 4].get();
}

bool Feed::isCurrentDeckLoaded() {
  int idx = getCurrentIndex();
  if (idx >= 0 && idx < (int)decks.size()) {
    return decks[idx].loadingTime > TIME_BEFORE_FORCE_LOADING_NEXT_DECK || decks[idx].isLoaded
        || decks[idx].hasNetworkError;
  }

  return true;
}
