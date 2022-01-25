#include "feed.h"
#include "engine.h"
#include "archive.h"
#include "behaviors/all.h"
#include "library.h"
#include "api.h"
#include <thread>

#define TOP_PADDING 60
#define CARD_WIDTH 800
#define CARD_HEIGHT 1120
#define FEED_ITEM_HEIGHT (CARD_WIDTH + 200)

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
  }
}

int Feed::getCurrentIndex() {
  int idx = floor((FEED_ITEM_HEIGHT / 2.0 - yOffset) / FEED_ITEM_HEIGHT);
  if (idx < 0) {
    idx = 0;
  }
  if (idx >= (int)decks.size()) {
    idx = decks.size() - 1;
  }

  return idx;
}

void Feed::update(double dt) {
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

  Debug::display("fps: {}", lv.timer.getFPS());
  elapsedTime += dt;

  gesture.update();
  gesture.withSingleTouch([&](const Touch &touch) {
    if (touch.pressed) {
      ignoreCurrentTouch = touch.screenPos.y < CARD_HEIGHT + TOP_PADDING;
    }

    if (ignoreCurrentTouch) {
      return;
    }

    isAnimating = false;

    if (!hasTouch) {
      hasTouch = true;
      touchDuration = 0.0;
      touchStartYOffset = yOffset;
      dragStarted = false;
      preDragOffset = 0.0;
      dragVelocity = 0.0;
    } else {
      if (!dragStarted) {
        preDragOffset += touch.screenPos.x - lastTouchPosition;

        if (fabs(preDragOffset) > DRAG_START_OFFSET) {
          dragStarted = true;
        }
      }

      if (dragStarted) {
        yOffset += (touch.screenPos.x - lastTouchPosition) * SCROLL_MULTIPLIER;
        float rollingAvgAmt = dt / DRAG_VELOCITY_ROLLING_AVERAGE_TIME;
        dragVelocity = (touch.screenPos.x - lastTouchPosition) * rollingAvgAmt
            + dragVelocity * (1.0 - rollingAvgAmt);
      }
    }

    lastTouchPosition = touch.screenPos.x;
    touchDuration += dt;

    if (touch.released) {
      hasTouch = false;
      isAnimating = true;
      animateFromYOffset = yOffset;
      animationTimeElapsed = 0.0;

      if (touchDuration < FAST_SWIPE_MAX_DURATION
          && fabs(yOffset - touchStartYOffset) > FAST_SWIPE_MIN_OFFSET) {
        if (yOffset - touchStartYOffset > 0) {
          animateToYOffset = (round(touchStartYOffset / FEED_ITEM_HEIGHT) + 1) * FEED_ITEM_HEIGHT;
        } else {
          animateToYOffset = (round(touchStartYOffset / FEED_ITEM_HEIGHT) - 1) * FEED_ITEM_HEIGHT;
        }
      } else if (fabs(dragVelocity) > FAST_SWIPE_MIN_DRAG_VELOCITY) {
        if (dragVelocity > 0) {
          animateToYOffset = (round(touchStartYOffset / FEED_ITEM_HEIGHT) + 1) * FEED_ITEM_HEIGHT;
        } else {
          animateToYOffset = (round(touchStartYOffset / FEED_ITEM_HEIGHT) - 1) * FEED_ITEM_HEIGHT;
        }
      } else {
        animateToYOffset = round((yOffset) / FEED_ITEM_HEIGHT) * FEED_ITEM_HEIGHT;
      }
    }
  });

  if (isAnimating) {
    yOffset = smoothstep(
        animateFromYOffset, animateToYOffset, animationTimeElapsed / SCROLL_ANIMATION_TIME);
    animationTimeElapsed += dt;
    if (animationTimeElapsed >= SCROLL_ANIMATION_TIME) {
      isAnimating = false;
      yOffset = animateToYOffset;
    }
  }

  int idx = getCurrentIndex();
  if (!hasTouch && !isAnimating) {
    if (idx >= 0 && idx < (int)decks.size() && decks[idx].player) {
      if (decks[idx].player->hasScene()) {
        if (auto nextCardId = decks[idx].player->getScene().getNextCardId(); nextCardId) {
          API::loadCard(nextCardId->c_str(), true, [=](APIResponse &response) {
            if (response.success && idx == getCurrentIndex()) {
              auto reader = response.reader;
              decks[idx].player->readScene(reader, decks[idx].player->getScene().getDeckId());
              decks[idx].player->getScene().getGesture().setOffset(0, TOP_PADDING);
            }
          });
          decks[idx].player->getScene().setNextCardId(std::nullopt);
        }
      }

      decks[idx].player->update(dt);
    }

    for (size_t i = 0; i < decks.size(); i++) {
      if (decks[i].isLoaded && !decks[i].hasRunUpdate) {
        decks[i].player->update(dt);
        decks[i].hasRunUpdate = true;
      }
    }

    if (decks.size() > 0 && idx > decks.size() - 3) {
      fetchMoreDecks();
    }
  }

  coreView->update(dt);
  coreView->handleGesture(gesture);
}

void Feed::renderCardAtPosition(int idx, float position, bool isActive) {
  if (idx < 0) {
    return;
  }

  if (!hasTouch && !isAnimating) {
    loadDeckAtIndex(idx);
  }

  if (idx >= (int)decks.size()) {
    return;
  }

  if (!decks[idx].player) {
    return;
  }

  if (!decks[idx].hasRunUpdate) {
    return;
  }

  bool shouldDraw = isActive;

  if (!decks[idx].hasRendered) {
    decks[idx].hasRendered = true;
    shouldDraw = true;
  }

  if (!decks[idx].canvas) {
    decks[idx].canvas = std::shared_ptr<love::graphics::Canvas>(newCanvas(CARD_WIDTH, CARD_HEIGHT));
  }
  std::shared_ptr<love::graphics::Canvas> canvas = decks[idx].canvas;

  lv.graphics.push(love::Graphics::STACK_ALL);

  if (shouldDraw) {
    renderToCanvas(canvas.get(), [&]() {
      lv.graphics.setColor({ 1.0, 1.0, 1.0, 1.0 });
      decks[idx].player->draw();
    });
  }

  viewTransform.reset();
  viewTransform.translate(position, TOP_PADDING);
  lv.graphics.applyTransform(&viewTransform);

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
  lv.graphics.setShader(shader.get());

  auto focusPercent = decks[idx].focusPercent;

  float cardScale = 0.9 + 0.1 * focusPercent;

  {
    auto info = shader->getUniformInfo("radius");
    info->floats[0] = 0.08 * (1.0 - focusPercent);
    shader->updateUniform(info, 1);
  }

  {
    auto info = shader->getUniformInfo("brightness");
    info->floats[0] = 0.8 + (0.2 * focusPercent);
    shader->updateUniform(info, 1);
  }

  quad->setTexture(canvas.get());
  lv.graphics.setColor({ 1.0, 1.0, 1.0, 1.0 });
  quad->draw(&lv.graphics,
      love::Matrix4(CARD_WIDTH * (1.0 - cardScale) * 0.5, CARD_HEIGHT * (1.0 - cardScale) * 0.5, 0,
          CARD_WIDTH * cardScale, CARD_HEIGHT * cardScale, 0, 0, 0, 0));
  quad->setTexture(nullptr);
  lv.graphics.setShader();

  lv.graphics.pop();
}

void Feed::makeShader() {
  static const char vert[] = R"(
    vec4 position(mat4 transformProjection, vec4 vertexPosition) {
      return transformProjection * vertexPosition;
    }
  )";
  static const char frag[] = R"(
    uniform float radius;
    uniform float brightness;

    vec4 effect(vec4 color, Image tex, vec2 texCoords, vec2 screenCoords) {
      if (texCoords.x < radius && texCoords.y < radius && distance(texCoords, vec2(radius, radius)) > radius) {
        discard;
      }
    
      if (texCoords.x < radius && texCoords.y > 1.0 - radius && distance(texCoords, vec2(radius, 1.0 - radius)) > radius) {
        discard;
      }

      if (texCoords.x > 1.0 - radius && texCoords.y < radius && distance(texCoords, vec2(1.0 - radius, radius)) > radius) {
        discard;
      }
    
      if (texCoords.x > 1.0 - radius && texCoords.y > 1.0 - radius && distance(texCoords, vec2(1.0 - radius, 1.0 - radius)) > radius) {
        discard;
      }

      return vec4(Texel(tex, texCoords).rgb * brightness, 1.0);
    }
  )";
  shader.reset(
      lv.graphics.newShader(lv.wrapVertexShaderCode(vert), lv.wrapFragmentShaderCode(frag)));
}

void Feed::draw() {
  if (!shader) {
    makeShader();
  }

  int idx = getCurrentIndex();
  // float padding = (FEED_ITEM_HEIGHT - CARD_HEIGHT) / 2.0;
  float padding = 0.0;

  renderCardAtPosition(idx - 1, yOffset + FEED_ITEM_HEIGHT * (idx - 1) + padding, false);
  renderCardAtPosition(idx, yOffset + FEED_ITEM_HEIGHT * idx + padding, !hasTouch && !isAnimating);
  renderCardAtPosition(idx + 1, yOffset + FEED_ITEM_HEIGHT * (idx + 1) + padding, false);
  renderCardAtPosition(idx + 2, yOffset + FEED_ITEM_HEIGHT * (idx + 2) + padding, false);

  for (int i = 0; i <= idx - 2; i++) {
    unloadDeckAtIndex(i);
  }

  for (int i = idx + 3; i < (int)decks.size(); i++) {
    unloadDeckAtIndex(i);
  }

  static auto playButton = [&]() {
    std::vector<love::Vector2> verts {
      { 50, 0 },
      { 0, 25 },
      { 50, 50 },
    };
    return verts;
  }();


  lv.graphics.setColor({ 1.0, 1.0, 1.0, 1.0 });

  for (int i = 0; i < 5; i++) {
    lv.graphics.push(love::Graphics::STACK_ALL);
    viewTransform.reset();
    viewTransform.translate(CARD_WIDTH / 2.0 + (i - 2.5) * 70, CARD_HEIGHT + 80);
    lv.graphics.applyTransform(&viewTransform);

    lv.graphics.polyline(&playButton[0], 3);
    lv.graphics.pop();
  }

  coreView->render();
}

void Feed::fetchInitialDecks() {
  coreView = CoreViews::getInstance().getRenderer("FEED");

  fetchingDecks = true;
  API::graphql("{\n  infiniteFeed {\n    sessionId\n    decks {\n      deckId\n      variables\n   "
               "   initialCard {\n        sceneDataUrl\n      }\n    }\n  }\n}",
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
                  feedItem.isLoaded = false;
                  feedItem.hasRunUpdate = false;
                  feedItem.hasRendered = false;
                  feedItem.shouldFocus = false;
                  feedItem.focusPercent = 1.0;
                  deckIds.insert(deckId);
                  decks.push_back(std::move(feedItem));
                });
              });
            });
          });

          loadDeckAtIndex(0);
          loadDeckAtIndex(1);
          fetchingDecks = false;
        }
      });
}

void Feed::fetchMoreDecks() {
  if (fetchingDecks) {
    return;
  }

  fetchingDecks = true;
  API::graphql("{\n  infiniteFeed(sessionId: \"" + sessionId
          + "\") {\n    decks {\n      deckId\n      variables\n      initialCard {\n        "
            "sceneDataUrl\n      }\n    }\n  }\n}",
      [=](APIResponse &response) {
        if (response.success) {
          auto &reader = response.reader;

          reader.obj("data", [&]() {
            reader.obj("infiniteFeed", [&]() {
              reader.arr("decks", [&]() {
                reader.each([&]() {
                  std::string deckId = reader.str("deckId", "");

                  if (deckIds.find(deckId) == deckIds.end()) {
                    FeedItem feedItem;
                    feedItem.deckJson = reader.toJson();
                    feedItem.isLoaded = false;
                    feedItem.hasRunUpdate = false;
                    feedItem.hasRendered = false;
                    feedItem.focusPercent = 1.0;
                    deckIds.insert(deckId);
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

  if (decks[i].player) {
    return;
  }

  decks[i].player = std::make_shared<Player>(bridge);
  std::thread t([=] {
    auto deckArchive = Archive::fromJson(decks[i].deckJson.c_str());
    deckArchive.read([&](Reader &reader) {
      std::string deckId = reader.str("deckId", "");

      reader.arr("variables", [&]() {
        decks[i].player->readVariables(reader);
      });

      reader.obj("initialCard", [&]() {
        auto sceneDataUrl = reader.str("sceneDataUrl", "");
        API::loadSceneData(sceneDataUrl, [=](APIResponse &response) {
          if (response.success) {
            const std::string readerJson = response.reader.toJson();
            std::thread t2([=] {
              decks[i].player->readScene(readerJson, deckId);
              decks[i].player->getScene().getGesture().setOffset(0, TOP_PADDING);
              decks[i].isLoaded = true;
            });
            t2.detach();
          }
        });
      });
    });
  });
  t.detach();
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
  decks[i].hasRendered = false;
  decks[i].player.reset();
  decks[i].canvas.reset();
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
