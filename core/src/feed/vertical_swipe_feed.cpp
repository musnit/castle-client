#include "feed.h"
#include "engine.h"
#include "archive.h"
#include "behaviors/all.h"
#include "library.h"
#include "api.h"
#include <thread>

#define CARD_WIDTH 800
#define CARD_HEIGHT 1120
#define FEED_ITEM_HEIGHT (CARD_HEIGHT + 200)
#define ANIMATION_TIME 0.2

int VerticalSwipeFeed::getCurrentIndex() {
  int idx = floor((FEED_ITEM_HEIGHT / 2.0 - yOffset) / FEED_ITEM_HEIGHT);
  if (idx < 0) {
    idx = 0;
  }
  if (idx >= (int)decks.size()) {
    idx = decks.size() - 1;
  }

  return idx;
}

void VerticalSwipeFeed::update(double dt) {
  Debug::display("fps: {}", lv.timer.getFPS());

  gesture.update();
  gesture.withSingleTouch([&](const Touch &touch) {
    if (touch.pressed) {
      ignoreCurrentTouch = touch.screenPos.x > 50 && touch.screenPos.x < CARD_WIDTH - 50
          && touch.screenPos.y > 150 && touch.screenPos.y < CARD_HEIGHT - 50;
    }

    if (ignoreCurrentTouch) {
      return;
    }

    isAnimating = false;

    if (!hasTouch) {
      hasTouch = true;
      touchStartYOffset = yOffset;
      touchVelocity = 0.0;
      touchDuration = 0.0;
    } else {
      touchVelocity = (touch.screenPos.y - lastTouchPosition) * 0.3 + touchVelocity * 0.9;
      yOffset += (touch.screenPos.y - lastTouchPosition) * 1.2;
    }

    lastTouchPosition = touch.screenPos.y;
    touchDuration += dt;

    if (touch.released) {
      hasTouch = false;
      isAnimating = true;
      animateFromYOffset = yOffset;
      animationTimeElapsed = 0.0;
      if (fabs(touchVelocity) > 20.0) {
        if (touchVelocity > 0) {
          animateToYOffset = (round(touchStartYOffset / FEED_ITEM_HEIGHT) + 1) * FEED_ITEM_HEIGHT;
        } else {
          animateToYOffset = (round(touchStartYOffset / FEED_ITEM_HEIGHT) - 1) * FEED_ITEM_HEIGHT;
        }
      } else if (touchDuration < 0.2 && touch.screenPos.y > CARD_HEIGHT && !touch.movedNear) {
        animateToYOffset = (round(touchStartYOffset / FEED_ITEM_HEIGHT) - 1) * FEED_ITEM_HEIGHT;
      } else {
        animateToYOffset
            = round((yOffset - FEED_ITEM_HEIGHT * 0.1) / FEED_ITEM_HEIGHT) * FEED_ITEM_HEIGHT;
      }
    }
  });

  if (isAnimating) {
    yOffset
        = smoothstep(animateFromYOffset, animateToYOffset, animationTimeElapsed / ANIMATION_TIME);
    animationTimeElapsed += dt;
    if (animationTimeElapsed >= ANIMATION_TIME) {
      isAnimating = false;
      yOffset = animateToYOffset;
    }
  }

  if (!hasTouch && !isAnimating) {
    int idx = getCurrentIndex();
    if (idx >= 0 && idx < (int)decks.size() && decks[idx].player) {
      decks[idx].player->update(dt);
    }

    for (size_t i = 0; i < decks.size(); i++) {
      if (decks[i].isLoaded && !decks[i].hasRunUpdate) {
        decks[i].player->update(dt);
        decks[i].hasRunUpdate = true;
      }
    }

    if (decks.size() > 0 && idx > decks.size() - 2) {
      fetchMoreDecks();
    }
  }
}

void VerticalSwipeFeed::renderCardAtPosition(int idx, float position, bool isActive) {
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

  bool shouldDraw = isActive;

  if (decks[idx].hasRunUpdate || !decks[idx].hasRendered) {
    decks[idx].hasRendered = true;
    shouldDraw = true;
  }

  if (!decks[idx].canvas) {
    decks[idx].canvas = std::unique_ptr<love::graphics::Canvas>(newCanvas(CARD_WIDTH, CARD_HEIGHT));
  }

  lv.graphics.push(love::Graphics::STACK_ALL);

  if (shouldDraw) {
    renderToCanvas(decks[idx].canvas.get(), [&]() {
      lv.graphics.setColor({ 1.0, 1.0, 1.0, 1.0 });
      decks[idx].player->draw();
    });
  }

  viewTransform.reset();
  viewTransform.translate(0, position);
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

  lv.graphics.setColor({ 1.0, 1.0, 1.0, 1.0 });

  quad->setTexture(decks[idx].canvas.get());
  quad->draw(&lv.graphics,
      love::Matrix4(CARD_WIDTH * (1.0 - cardScale) * 0.5, CARD_HEIGHT * (1.0 - cardScale) * 0.5, 0,
          CARD_WIDTH * cardScale, CARD_HEIGHT * cardScale, 0, 0, 0, 0));
  quad->setTexture(nullptr);

  lv.graphics.setShader();

  lv.graphics.pop();
}

void VerticalSwipeFeed::makeShader() {
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

void VerticalSwipeFeed::draw() {
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
}

void VerticalSwipeFeed::fetchInitialDecks() {
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

void VerticalSwipeFeed::fetchMoreDecks() {
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

void VerticalSwipeFeed::loadDeckAtIndex(int i) {
  if (i >= (int)decks.size() || i < 0) {
    return;
  }

  if (decks[i].player) {
    return;
  }

  decks[i].player = std::make_unique<Player>(bridge);
  std::thread t([=] {
    auto deckArchive = Archive::fromJson(decks[i].deckJson.c_str());
    deckArchive.read([&](Reader &reader) {
      reader.arr("variables", [&]() {
        decks[i].player->readVariables(reader);
      });

      reader.obj("initialCard", [&]() {
        auto sceneDataUrl = reader.str("sceneDataUrl", "");
        API::loadSceneData(sceneDataUrl, [=](APIResponse &response) {
          if (response.success) {
            const std::string readerJson = response.reader.toJson();
            std::thread t2([=] {
              decks[i].player->readScene(readerJson);
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

void VerticalSwipeFeed::unloadDeckAtIndex(int i) {
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

love::graphics::Canvas *VerticalSwipeFeed::newCanvas(int width, int height) {
  love::graphics::Canvas::Settings settings;
  settings.width = width;
  settings.height = height;
  settings.dpiScale = 1;
  settings.msaa = 4;

  return lv.graphics.newCanvas(settings);
}

void VerticalSwipeFeed::renderToCanvas(
    love::graphics::Canvas *canvas, const std::function<void()> &lambda) {
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
