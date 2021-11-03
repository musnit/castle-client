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

Feed::Feed(Bridge &bridge_)
    : bridge(bridge_) {
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
  Debug::display("fps: {}", lv.timer.getFPS());

  // TODO: make scene optional in gesture constructor
  if (!gesture && decks.size() > 0 && decks[0].player && decks[0].player->hasScene()) {
    gesture = std::make_unique<Gesture>(decks[0].player->getScene());
  }

  if (gesture) {
    gesture->update();

    if (gesture->getCount() == 1) {
      gesture->withSingleTouch([&](const Touch &touch) {
        if (!hasTouch) {
          hasTouch = true;
        } else {
          yOffset += touch.screenPos.y - lastTouchPosition;
        }

        lastTouchPosition = touch.screenPos.y;

        if (touch.released) {
          hasTouch = false;
        }
      });
    }
  }

  if (!hasTouch) {
    int idx = getCurrentIndex();
    if (idx < (int)decks.size() && decks[idx].player) {
      decks[idx].player->update(dt);
    }

    for (size_t i = 0; i < decks.size(); i++) {
      if (decks[i].isLoaded && !decks[i].hasRunUpdate) {
        decks[i].player->update(dt);
        decks[i].hasRunUpdate = true;
      }
    }
  }
}

void Feed::renderCardAtPosition(int idx, float position, bool isActive) {
  if (idx < 0) {
    return;
  }

  if (!hasTouch) {
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
    renderToCanvas(decks[idx].canvas.get(), [=]() {
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
  quad->setTexture(decks[idx].canvas.get());
  lv.graphics.setColor({ 1.0, 1.0, 1.0, 1.0 });
  quad->draw(&lv.graphics, love::Matrix4(0, 0, 0, CARD_WIDTH, CARD_HEIGHT, 0, 0, 0, 0));
  quad->setTexture(nullptr);

  lv.graphics.pop();
}

void Feed::draw() {
  int idx = getCurrentIndex();

  renderCardAtPosition(idx - 1, yOffset + FEED_ITEM_HEIGHT * (idx - 1), false);
  renderCardAtPosition(idx, yOffset + FEED_ITEM_HEIGHT * idx, !hasTouch);
  renderCardAtPosition(idx + 1, yOffset + FEED_ITEM_HEIGHT * (idx + 1), false);
}

void Feed::loadDecks(const char *decksJson) {
  auto archive = Archive::fromJson(decksJson);
  archive.read([&](Reader &reader) {
    reader.arr("decks", [&]() {
      reader.each([&]() {
        FeedItem feedItem;
        feedItem.deckJson = *reader.str();
        feedItem.isLoaded = false;
        feedItem.hasRunUpdate = false;
        feedItem.hasRendered = false;
        decks.push_back(std::move(feedItem));
      });
    });
  });

  loadDeckAtIndex(0);
  loadDeckAtIndex(1);
}

void Feed::loadDeckAtIndex(int i) {
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
