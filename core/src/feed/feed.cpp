#include "feed.h"
#include "engine.h"
#include "archive.h"
#include "behaviors/all.h"
#include "library.h"
#include "api.h"
#include <thread>
#include "utils/format_number.h"
#include "deck_plays.h"

#define TOP_PADDING 0
#define BOTTOM_UI_MIN_HEIGHT 140
// #define DEBUG_CLICK_TO_ADVANCE

// creator.photo.url and initialCard.backgroundImage.smallUrl needed for DeckRemixesScreen
const std::string GRAPHQL_DECK_FIELDS
    = "\ndeckId\ncaption\nvariables\nchildDecksCount\ncreator {\nuserId\nusername\nphoto "
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

float smoothstep(float a, float b, float t) {
  int ANIMATION_EASING_FUNCTION
      = CoreViews::getInstance().getNumConstant("ANIMATION_EASING_FUNCTION");
  switch (ANIMATION_EASING_FUNCTION) {
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
  default:
    return 0;
  }
}

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
        decks[i].coreView->updateProp("container", "top", std::to_string(cardHeight + 20));
      }
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

bool Feed::hasScene() {
  int idx = getCurrentIndex();
  return idx >= 0 && idx < (int)decks.size() && decks[idx].player && decks[idx].player->hasScene();
}

Scene &Feed::getScene() {
  int idx = getCurrentIndex();
  return decks[idx].player->getScene();
}

void Feed::setPaused(bool paused_) {
  paused = paused_;
}

void Feed::update(double dt) {
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

  bool shouldSkipUpdate = fps < 20;

  gesture.update();
  gesture.withSingleTouch([&](const Touch &touch) {
    if (touch.pressed) {
      ignoreCurrentTouch = touch.screenPos.y < cardHeight + TOP_PADDING;
    }

    if (ignoreCurrentTouch) {
      return;
    }

    isAnimating = false;

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
            if (decks[idx].player && decks[idx].player->hasScene()) {
              // TODO: maybe use scene suspend/resume, unless you want to leave sound thread running
              decks[idx].player->getScene().getSound().stopCurrentlyPlayingSounds();
            }

            if (decks[idx].coreView) {
              decks[idx].coreView->cancelGestures();
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
        } else if (usingFixedDecksList && offset < (-feedItemWidth * ((float)decks.size() - 1.0))) {
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
          } else {
            animateToOffset = (round(touchStartOffset / feedItemWidth) - 1) * feedItemWidth;
          }
        } else if (fabs(dragVelocity) > FAST_SWIPE_MIN_DRAG_VELOCITY) {
          if (dragVelocity > 0) {
            animateToOffset = (round(touchStartOffset / feedItemWidth) + 1) * feedItemWidth;
          } else {
            animateToOffset = (round(touchStartOffset / feedItemWidth) - 1) * feedItemWidth;
          }
        } else {
          animateToOffset = round((offset) / feedItemWidth) * feedItemWidth;
        }

        // Don't allow animating to before the first card
        if (animateToOffset > 0.0) {
          animateToOffset = 0.0;
        }
        if (usingFixedDecksList
            && animateToOffset < (-feedItemWidth * ((float)decks.size() - 1.0))) {
          animateToOffset = (-feedItemWidth * ((float)decks.size() - 1.0));
        }
      }

#ifdef DEBUG_CLICK_TO_ADVANCE
      isAnimating = true;
      animateFromOffset = offset;
      animationTimeElapsed = 0.0;
      animateToOffset = (round(touchStartOffset / feedItemWidth) - 1) * feedItemWidth;
#endif
    }
  });

  if (isAnimating) {
    offset = smoothstep(
        animateFromOffset, animateToOffset, animationTimeElapsed / SCROLL_ANIMATION_TIME);
    animationTimeElapsed += dt;
    if (animationTimeElapsed >= SCROLL_ANIMATION_TIME) {
      isAnimating = false;
      offset = animateToOffset;
    }
  }

  int idx = getCurrentIndex();
  if (!dragStarted && !isAnimating) {
    if (!shouldSkipUpdate && idx >= 0 && idx < (int)decks.size() && decks[idx].player) {
      if (decks[idx].player->hasScene()) {
        if (auto nextCardId = decks[idx].player->getScene().getNextCardId(); nextCardId) {
          API::loadCard(nextCardId->c_str(), true, [=](APIResponse &response) {
            if (response.success && idx == getCurrentIndex()) {
              auto reader = response.reader;
              decks[idx].player->readScene(reader, decks[idx].player->getScene().getDeckId());
              decks[idx].player->getScene().getGesture().setBounds(
                  cardLeft, TOP_PADDING, cardWidth, cardHeight);
            }
          });
          decks[idx].player->getScene().setNextCardId(std::nullopt);
          decks[idx].cardId = nextCardId;
        }
      }

      if (!paused) {
        decks[idx].player->update(dt);
        decks[idx].hasRunUpdateSinceLastRender = true;

        if (decks[idx].deckId && decks[idx].cardId) {
          DeckPlays::getInstance().setDeckAndCardIds(*decks[idx].deckId, *decks[idx].cardId);
        }
        DeckPlays::getInstance().update(dt);
      }

      decks[idx].coreView->update(dt);
      decks[idx].coreView->handleGesture(gesture, cardLeft, TOP_PADDING);
    }

    for (size_t i = 0; i < decks.size(); i++) {
      if (decks[i].isLoaded && !decks[i].hasRunUpdate) {
        decks[i].player->update(dt);
        decks[i].hasRunUpdate = true;
        decks[i].hasRunUpdateSinceLastRender = true;
        if (decks[i].player->hasScene()) {
          // TODO: maybe use scene suspend/resume, unless you want to leave sound thread running
          decks[i].player->getScene().getSound().stopCurrentlyPlayingSounds();
        }
      }
    }

    if (decks.size() > 0 && idx > (int)decks.size() - 4 && !usingFixedDecksList) {
      fetchMoreDecks();
    }

    loadDeckAtIndex(idx - 1);
    loadDeckAtIndex(idx);
    loadDeckAtIndex(idx + 1);
    loadDeckAtIndex(idx + 2);
  }
}

void Feed::renderCardAtPosition(int idx, float position, bool isActive) {
  if (idx < 0) {
    return;
  }

  if (idx >= (int)decks.size()) {
    return;
  }

  if (!decks[idx].player || !decks[idx].hasRunUpdate) {
    lv.graphics.push(love::Graphics::STACK_ALL);
    viewTransform.reset();
    viewTransform.translate(position, TOP_PADDING);
    lv.graphics.applyTransform(&viewTransform);

    renderCardTexture(nullptr);

    lv.graphics.pop();

    return;
  }

  bool shouldDraw = isActive;

  if (!decks[idx].hasRendered) {
    decks[idx].hasRendered = true;
    shouldDraw = true;
  } else if (!decks[idx].hasRunUpdateSinceLastRender) {
    shouldDraw = false;
  }

  if (!decks[idx].canvas) {
    decks[idx].canvas = std::shared_ptr<love::graphics::Canvas>(newCanvas(cardWidth, cardHeight));
  }
  std::shared_ptr<love::graphics::Canvas> canvas = decks[idx].canvas;

  if (shouldDraw) {
    renderToCanvas(canvas.get(), [&]() {
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

  renderCardTexture(canvas.get());

  decks[idx].coreView->render();

  lv.graphics.pop();
}

void Feed::renderCardTexture(love::Texture *texture) {
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

  quad->setTexture(texture);
  lv.graphics.setColor({ 1.0, 1.0, 1.0, 1.0 });
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

      return Texel(tex, texCoords);
    }
  )";
  shader.reset(
      lv.graphics.newShader(lv.wrapVertexShaderCode(vert), lv.wrapFragmentShaderCode(frag)));

  static const char loadingFrag[] = R"(
    uniform float radius;
    uniform float width;
    uniform float height;

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

      return vec4(0.15, 0.15, 0.15, 1.0);
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

  int idx = getCurrentIndex();
  float padding = (windowWidth - cardWidth) / 2.0;

  renderCardAtPosition(idx - 1, offset + feedItemWidth * (idx - 1) + padding, false);
  renderCardAtPosition(idx, offset + feedItemWidth * idx + padding, !dragStarted && !isAnimating);
  renderCardAtPosition(idx + 1, offset + feedItemWidth * (idx + 1) + padding, false);
  renderCardAtPosition(idx + 2, offset + feedItemWidth * (idx + 2) + padding, false);

  // this releases a canvas, so we want to run it in render
  for (int i = 0; i <= idx - 2; i++) {
    unloadDeckAtIndex(i);
  }

  for (int i = idx + 3; i < (int)decks.size(); i++) {
    unloadDeckAtIndex(i);
  }
}

void Feed::suspend() {
}

void Feed::resume() {
}

void Feed::clearState() {
}

void Feed::fetchInitialDecks(std::vector<std::string> deckIds, int initialDeckIndex_) {
  initialDeckIndex = initialDeckIndex_;

  if (deckIds.size() > 0) {
    usingFixedDecksList = true;
    for (size_t i = 0; i < deckIds.size(); i++) {
      FeedItem feedItem;
      feedItem.deckId = deckIds[i];
      decks.push_back(std::move(feedItem));
    }
  } else {
    usingFixedDecksList = false;
    fetchingDecks = true;
    API::graphql(
        "{\n  infiniteFeed {\n    sessionId\n    decks {" + GRAPHQL_DECK_FIELDS + "}\n  }\n}",
        [=](APIResponse &response) {
          if (response.success) {
            auto &reader = response.reader;

            reader.obj("data", [&]() {
              reader.obj("infiniteFeed", [&]() {
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
          }
        });
  }
}

void Feed::fetchMoreDecks() {
  if (fetchingDecks || usingFixedDecksList) {
    return;
  }

  fetchingDecks = true;
  API::graphql("{\n  infiniteFeed(sessionId: \"" + sessionId + "\") {\n    decks {"
          + GRAPHQL_DECK_FIELDS + "}\n  }\n}",
      [=](APIResponse &response) {
        if (response.success) {
          auto &reader = response.reader;

          reader.obj("data", [&]() {
            reader.obj("infiniteFeed", [&]() {
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
        }

        fetchingDecks = false;
      });
}

void Feed::loadDeckAtIndex(int i) {
  if (i >= (int)decks.size() || i < 0) {
    return;
  }

  if (decks[i].player || decks[i].isLoading) {
    return;
  }

  decks[i].isLoading = true;

  if (decks[i].deckJson) {
    loadDeckFromDeckJson(i);
    decks[i].isLoading = false;
  } else {
    API::graphql(
        "{\n  deck(deckId: \"" + *decks[i].deckId + "\") {\n" + GRAPHQL_DECK_FIELDS + "\n}\n}",
        [=](APIResponse &response) {
          if (response.success) {
            auto &reader = response.reader;

            reader.obj("data", [&]() {
              reader.obj("deck", [&]() {
                // this will get loaded by loadDeckAtIndex on the main thread
                decks[i].deckJson = reader.toJson();
                decks[i].isLoading = false;
              });
            });
          }
        });
  }
}

void Feed::layoutCoreViews(int i) {
  float FEED_BOTTOM_ACTIONS_INITIAL_RIGHT
      = CoreViews::getInstance().getNumConstant("FEED_BOTTOM_ACTIONS_INITIAL_RIGHT");
  float FEED_BOTTOM_ACTIONS_TEXT_RIGHT_PADDING
      = CoreViews::getInstance().getNumConstant("FEED_BOTTOM_ACTIONS_TEXT_RIGHT_PADDING");
  float FEED_BOTTOM_ACTIONS_REACTION_ICON_RIGHT_PADDING
      = CoreViews::getInstance().getNumConstant("FEED_BOTTOM_ACTIONS_REACTION_ICON_RIGHT_PADDING");
  float FEED_BOTTOM_ACTIONS_COMMENT_ICON_RIGHT_PADDING
      = CoreViews::getInstance().getNumConstant("FEED_BOTTOM_ACTIONS_COMMENT_ICON_RIGHT_PADDING");
  float FEED_BOTTOM_ACTIONS_OVERFLOW_ICON_RIGHT_PADDING
      = CoreViews::getInstance().getNumConstant("FEED_BOTTOM_ACTIONS_OVERFLOW_ICON_RIGHT_PADDING");
  float FEED_BOTTOM_ACTIONS_SPACE_REACTION_BUTTON_AND_TEXT
      = CoreViews::getInstance().getNumConstant(
          "FEED_BOTTOM_ACTIONS_SPACE_REACTION_BUTTON_AND_TEXT");
  float FEED_BOTTOM_ACTIONS_SPACE_COMMENT_BUTTON_AND_TEXT = CoreViews::getInstance().getNumConstant(
      "FEED_BOTTOM_ACTIONS_SPACE_COMMENT_BUTTON_AND_TEXT");
  float FEED_BOTTOM_ACTIONS_SPACE_REMIX_BUTTON_AND_TEXT
      = CoreViews::getInstance().getNumConstant("FEED_BOTTOM_ACTIONS_SPACE_REMIX_BUTTON_AND_TEXT");
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
  currentRight += 5.5 * vw;

  if (decks[i].coreView->getProp("remix-count", "visibility") == "visible") {
    int remixCountWidth = decks[i].coreView->getView("remix-count").getContentWidth()
        + FEED_BOTTOM_ACTIONS_TEXT_RIGHT_PADDING * vw;
    decks[i].coreView->updateProp("remix-count", "width", std::to_string(remixCountWidth));
    decks[i].coreView->updateProp("remix-count", "right", std::to_string(currentRight), true);
    currentRight += remixCountWidth;
    currentRight += FEED_BOTTOM_ACTIONS_SPACE_REMIX_BUTTON_AND_TEXT * vw;
    decks[i].coreView->updateProp("remix-icon", "right", std::to_string(currentRight));
    currentRight += 5.5 * vw;
  }

  currentRight += FEED_BOTTOM_ACTIONS_OVERFLOW_ICON_RIGHT_PADDING * vw;
  decks[i].coreView->updateProp("overflow-icon", "right", std::to_string(currentRight));
}

void Feed::loadDeckFromDeckJson(int i) {
  decks[i].player = std::make_shared<Player>(bridge);
  decks[i].coreView
      = CoreViews::getInstance().getRenderer("FEED", cardWidth, windowHeight - (cardHeight + 20));
  decks[i].coreView->updateProp("container", "top", std::to_string(cardHeight + 20));
  decks[i].coreView->updateProp(
      "container", "height", std::to_string(windowHeight - (cardHeight + 20)));
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
    decks[i].coreView->updateJSGestureProp("deckId", deckId);
    decks[i].coreView->updateJSGestureProp("deck", *decks[i].deckJson);

    decks[i].coreView->updateProp("caption", "text", reader.str("caption", ""));

    reader.arr("variables", [&]() {
      decks[i].player->readVariables(reader);
    });

    reader.obj("creator", [&]() {
      decks[i].coreView->updateProp("username", "text", reader.str("username", ""));
      decks[i].coreView->updateJSGestureProp("userId", reader.str("userId", ""));

      reader.obj("photo", [&]() {
        decks[i].coreView->updateProp(
            "avatar", "url", reader.str("smallAvatarUrl", DEFAULT_AVATAR_URL));
      });
    });

    int childDecksCount = reader.num("childDecksCount", 0);
    if (childDecksCount > 0) {
      decks[i].coreView->updateProp("remix-count", "text", FormatNumber::toString(childDecksCount));
      decks[i].coreView->updateProp("remix-icon", "visibility", "visible");
      decks[i].coreView->updateProp("remix-count", "visibility", "visible");
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
      decks[i].cardId = reader.str("cardId", "");

      auto sceneDataUrl = reader.str("sceneDataUrl", "");
      API::loadSceneData(sceneDataUrl, [=](APIResponse &response) {
        if (response.success) {
          const std::string readerJson = response.reader.toJson();
          std::thread t2([=] {
            decks[i].player->readScene(readerJson, deckId);
            decks[i].player->getScene().getGesture().setBounds(
                cardLeft, TOP_PADDING, cardWidth, cardHeight);
            decks[i].isLoaded = true;
          });
          t2.detach();
        }
      });
    });
  });

  layoutCoreViews(i);
}

void Feed::unloadDeckAtIndex(int i) {
  if (i >= (int)decks.size() || i < 0) {
    return;
  }

  if (!decks[i].player) {
    return;
  }

  // don't unload a deck that's in the middle of loading
  if (!decks[i].isLoaded || !decks[i].hasRunUpdate || !decks[i].hasRendered) {
    return;
  }

  decks[i].isLoaded = false;
  decks[i].hasRunUpdate = false;
  decks[i].hasRunUpdateSinceLastRender = false;
  decks[i].hasRendered = false;
  decks[i].player.reset();
  decks[i].canvas.reset();
  decks[i].coreView.reset();
}

love::graphics::Canvas *Feed::newCanvas(int width, int height) {
  love::graphics::Canvas::Settings settings;
  settings.width = width;
  settings.height = height;
  settings.dpiScale = 1;
  settings.msaa = 4;

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
