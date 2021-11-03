#include "feed.h"
#include "engine.h"
#include "archive.h"
#include "behaviors/all.h"
#include "library.h"
#include "api.h"
#include <thread>

#define CARD_WIDTH 800
#define CARD_HEIGHT 1120

Feed::Feed(Bridge &bridge_)
    : bridge(bridge_) {
}

int Feed::getCurrentIndex() {
  int idx = floor((CARD_HEIGHT / 2.0 - yOffset) / CARD_HEIGHT);
  if (idx < 0) {
    idx = 0;
  }
  if (idx >= (int)decks.size()) {
    idx = decks.size() - 1;
  }

  return idx;
}

void Feed::update(double dt) {
  // TODO: make scene optional in gesture constructor
  if (!gesture && players.size() > 0 && players[0]->hasScene()) {
    gesture = std::make_unique<Gesture>(players[0]->getScene());
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
    if (idx < players.size()) {
      players[idx]->update(dt);
    }
  }
}

void Feed::renderCardAtPosition(int idx, float position) {
  if (idx < 0) {
    return;
  }

  loadDeckAtIndex(idx);

  if (idx >= (int)players.size()) {
    return;
  }

  if (!gameCanvas) {
    gameCanvas = newCanvas(CARD_WIDTH, CARD_HEIGHT);
  }

  lv.graphics.push(love::Graphics::STACK_ALL);

  renderToCanvas(gameCanvas, [=]() {
    lv.graphics.setColor({ 1.0, 1.0, 1.0, 1.0 });
    players[idx]->draw();
  });

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
  quad->setTexture(gameCanvas);
  lv.graphics.setColor({ 1.0, 1.0, 1.0, 1.0 });
  quad->draw(&lv.graphics, love::Matrix4(0, 0, 0, CARD_WIDTH, CARD_HEIGHT, 0, 0, 0, 0));
  quad->setTexture(nullptr);

  lv.graphics.pop();
}

void Feed::draw() {
  int idx = getCurrentIndex();

  renderCardAtPosition(idx - 1, yOffset + CARD_HEIGHT * (idx - 1));
  renderCardAtPosition(idx, yOffset + CARD_HEIGHT * idx);
  renderCardAtPosition(idx + 1, yOffset + CARD_HEIGHT * (idx + 1));
}

void Feed::loadDecks(const char *decksJson) {
  auto archive = Archive::fromJson(decksJson);
  archive.read([&](Reader &reader) {
    reader.arr("decks", [&]() {
      reader.each([&]() {
        decks.push_back(*reader.str());
      });
    });
  });

  loadDeckAtIndex(0);
  loadDeckAtIndex(1);
}

void Feed::loadDeckAtIndex(int i) {
  if (i >= (int)decks.size()) {
    return;
  }

  if (i != (int)players.size()) {
    return;
  }

  players.push_back(std::make_unique<Player>(bridge));
  std::thread t([=] {
    auto deckArchive = Archive::fromJson(decks[i].c_str());
    deckArchive.read([&](Reader &reader) {
      reader.arr("variables", [&]() {
        players[i]->readVariables(reader);
      });

      reader.obj("initialCard", [&]() {
        auto sceneDataUrl = reader.str("sceneDataUrl", "");
        API::loadSceneData(sceneDataUrl, [=](APIResponse &response) {
          if (response.success) {
            const std::string readerJson = response.reader.toJson();
            std::thread t2([=] {
              players[i]->readScene(readerJson);
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
