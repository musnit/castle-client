#include "player.h"

//
// Constructor, destructor
//

Player::Player(Bridge &bridge_, Lv &lv_)
    : bridge(bridge_)
    , lv(lv_) {
}

void Player::tryLoadVariables() {
#ifdef __EMSCRIPTEN__
  if (auto variablesJson = JS_getVariables()) {
    auto archive = Archive::fromJson(variablesJson);
    archive.read([&](Reader &reader) {
      reader.arr("variables", [&]() {
        variables.read(reader);
      });
    });
  }
#endif
}

void Player::tryLoadNextCard() {
#ifdef __EMSCRIPTEN__
  if (auto sceneDataJson = JS_getNextCardSceneData()) {
    sceneArchive = Archive::fromJson(sceneDataJson);
    sceneArchive.read([&](Reader &reader) {
      reader.obj("snapshot", [&]() {
        scene = std::make_unique<Scene>(bridge, variables, &reader);
      });
    });
    free(sceneDataJson);
  }
#endif
}

void Player::readScene(Reader &reader) {
  scene = std::make_unique<Scene>(bridge, variables, &reader);
}

void Player::readVariables(Reader &reader) {
  variables.read(reader);
};

Variables &Player::getVariables() {
  return variables;
}

void Player::update(double dt) {
  tryLoadVariables();
  tryLoadNextCard();

  // Update scene
  if (scene) {
    if (scene->isRestartRequested()) {
      sceneArchive.read([&](Reader &reader) {
        reader.obj("snapshot", [&]() {
          scene = std::make_unique<Scene>(bridge, variables, &reader);
        });
      });
    }

    Debug::display("fps: {}", lv.timer.getFPS());
    Debug::display("actors: {}", scene->numActors());

    scene->update(dt);

    Debug::display("variables:");
    variables.forEach([&](const char *name, const ExpressionValue &value) {
      if (value.is<double>()) {
        Debug::display("  {}: {}", name, value.as<double>());
      }
    });
  }
}

void Player::draw() {
  if (scene) {
    scene->draw();
  }

  // Debug messages
  if (Debug::isEnabled) {
    if (scene) {
      // Scene exists -- draw debug messages in black
      lv.graphics.setColor(love::Colorf(0, 0, 0, 1));
    } else {
      // No scene -- show loading message in white on black background
      Debug::display("loading...");
      lv.graphics.setColor(love::Colorf(1, 1, 1, 1));
    }
    lv.graphics.print({ { Debug::getAndClearDisplay(), { 1, 1, 1, 1 } } }, debugFont.get(),
        love::Matrix4(20, 20, 0, 1, 1, 0, 0, 0, 0));
  }
}
