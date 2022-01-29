#include "feed.h"
#include "engine.h"
#include "archive.h"
#include "behaviors/all.h"
#include "library.h"
#include "api.h"
#include <thread>

#define TOP_PADDING 0
#define CARD_WIDTH 800
#define CARD_HEIGHT 1120
#define FEED_ITEM_WIDTH (CARD_WIDTH + 200)

const std::string GRAPHQL_DECK_FIELDS
    = "\ndeckId\nvariables\ncreator {\nuserId\nusername\nphoto "
      "{\nsmallAvatarUrl\n}\n}\ninitialCard {\n    "
      "    sceneDataUrl\n      }\n    commentsEnabled\n  comments {\n count\n }\n reactions {\n "
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
  }
}

void Feed::setWindowSize(int w, int h) {
  windowWidth = w;
  windowHeight = h;
}

int Feed::getCurrentIndex() {
  int idx = floor((FEED_ITEM_WIDTH / 2.0 - offset) / FEED_ITEM_WIDTH);
  if (idx < 0) {
    idx = 0;
  }
  if (idx >= (int)decks.size()) {
    idx = decks.size() - 1;
  }

  return idx;
}

Scene *Feed::getScene() {
  int idx = getCurrentIndex();
  if (idx >= 0 && idx < (int)decks.size() && decks[idx].player && decks[idx].player->hasScene()) {
    return &(decks[idx].player->getScene());
  }

  return nullptr;
}

void Feed::setPaused(bool paused_) {
  paused = paused_;
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

  int fps = lv.timer.getFPS();
  Debug::display("fps: {}", fps);
  elapsedTime += dt;

  bool shouldSkipUpdate = fps < 20;

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
              decks[idx].player->getScene().getSound().stopAll();
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
            animateToOffset = (round(touchStartOffset / FEED_ITEM_WIDTH) + 1) * FEED_ITEM_WIDTH;
          } else {
            animateToOffset = (round(touchStartOffset / FEED_ITEM_WIDTH) - 1) * FEED_ITEM_WIDTH;
          }
        } else if (fabs(dragVelocity) > FAST_SWIPE_MIN_DRAG_VELOCITY) {
          if (dragVelocity > 0) {
            animateToOffset = (round(touchStartOffset / FEED_ITEM_WIDTH) + 1) * FEED_ITEM_WIDTH;
          } else {
            animateToOffset = (round(touchStartOffset / FEED_ITEM_WIDTH) - 1) * FEED_ITEM_WIDTH;
          }
        } else {
          animateToOffset = round((offset) / FEED_ITEM_WIDTH) * FEED_ITEM_WIDTH;
        }

        // Don't allow animating to before the first card
        if (animateToOffset > 0.0) {
          animateToOffset = 0.0;
        }
      }
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
                  0, TOP_PADDING, CARD_WIDTH, CARD_HEIGHT);
            }
          });
          decks[idx].player->getScene().setNextCardId(std::nullopt);
        }
      }

      if (!paused) {
        decks[idx].player->update(dt);
        decks[idx].hasRunUpdateSinceLastRender = true;
      }

      decks[idx].coreView->update(dt);
      decks[idx].coreView->handleGesture(gesture);
    }

    for (size_t i = 0; i < decks.size(); i++) {
      if (decks[i].isLoaded && !decks[i].hasRunUpdate) {
        decks[i].player->update(dt);
        decks[i].hasRunUpdate = true;
        decks[i].hasRunUpdateSinceLastRender = true;
        if (decks[i].player->hasScene()) {
          decks[i].player->getScene().getSound().stopAll();
        }
      }
    }

    if (decks.size() > 0 && idx > (int)decks.size() - 4) {
      fetchMoreDecks();
    }
  }
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
  } else if (!decks[idx].hasRunUpdateSinceLastRender) {
    shouldDraw = false;
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

    decks[idx].hasRunUpdateSinceLastRender = false;
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

  {
    auto info = shader->getUniformInfo("radius");
    info->floats[0] = CoreViews::getInstance().getNumConstant("CARD_BORDER_RADIUS");
    shader->updateUniform(info, 1);
  }

  {
    auto info = shader->getUniformInfo("width");
    info->floats[0] = CARD_WIDTH;
    shader->updateUniform(info, 1);
  }

  {
    auto info = shader->getUniformInfo("height");
    info->floats[0] = CARD_HEIGHT;
    shader->updateUniform(info, 1);
  }


  // / *
  quad->setTexture(canvas.get());
  lv.graphics.setColor({ 1.0, 1.0, 1.0, 1.0 });
  quad->draw(&lv.graphics, love::Matrix4(0.0, 0.0, 0, CARD_WIDTH, CARD_HEIGHT, 0, 0, 0, 0));
  quad->setTexture(nullptr);
  lv.graphics.setShader();
  //  * /

  decks[idx].coreView->render();

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
}

void Feed::draw() {
  if (!shader) {
    makeShader();
  }

  int idx = getCurrentIndex();
  // float padding = (FEED_ITEM_WIDTH - CARD_HEIGHT) / 2.0;
  float padding = 0.0;

  renderCardAtPosition(idx - 1, offset + FEED_ITEM_WIDTH * (idx - 1) + padding, false);
  renderCardAtPosition(idx, offset + FEED_ITEM_WIDTH * idx + padding, !dragStarted && !isAnimating);
  renderCardAtPosition(idx + 1, offset + FEED_ITEM_WIDTH * (idx + 1) + padding, false);
  renderCardAtPosition(idx + 2, offset + FEED_ITEM_WIDTH * (idx + 2) + padding, false);

  for (int i = 0; i <= idx - 3; i++) {
    unloadDeckAtIndex(i);
  }

  for (int i = idx + 4; i < (int)decks.size(); i++) {
    unloadDeckAtIndex(i);
  }
}

void Feed::fetchInitialDecks() {
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

                  if (deckIds.find(deckId) == deckIds.end()) {
                    FeedItem feedItem;
                    feedItem.deckJson = reader.toJson();
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
  decks[i].coreView = CoreViews::getInstance().getRenderer("FEED");

  std::thread t([=] {
    auto deckArchive = Archive::fromJson(decks[i].deckJson.c_str());
    deckArchive.read([&](Reader &reader) {
      std::string deckId = reader.str("deckId", "");
      decks[i].coreView->updateJSGestureProp("deckId", deckId);

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

      bool commentsEnabled = reader.boolean("commentsEnabled", false);
      decks[i].coreView->updateJSGestureProp("commentsEnabled", commentsEnabled ? "true" : "false");
      if (commentsEnabled) {
        reader.obj("comments", [&]() {
          int count = reader.num("count", 0);
          if (count > 0) {
            decks[i].coreView->updateProp("comment-count", "text", std::to_string(count));
          }
        });
      }

      reader.arr("reactions", [&]() {
        reader.each([&]() {
          std::string reactionId = reader.str("reactionId", "");

          if (reactionId == "fire") {
            int count = reader.num("count", 0);
            if (count > 0) {
              decks[i].coreView->updateProp("reaction-count", "text", std::to_string(count));
            }

            bool isCurrentUserToggled = reader.boolean("isCurrentUserToggled", false);
            if (isCurrentUserToggled) {
              decks[i].coreView->updateProp("reaction-icon", "filename", "fire-selected.png");
            }
          }
        });
      });

      reader.obj("initialCard", [&]() {
        auto sceneDataUrl = reader.str("sceneDataUrl", "");
        API::loadSceneData(sceneDataUrl, [=](APIResponse &response) {
          if (response.success) {
            const std::string readerJson = response.reader.toJson();
            std::thread t2([=] {
              decks[i].player->readScene(readerJson, deckId);
              decks[i].player->getScene().getGesture().setBounds(
                  0, TOP_PADDING, CARD_WIDTH, CARD_HEIGHT);
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
