#include "player.h"

#include "js.h"


//
// JavaScript bindings
//

JS_DEFINE(char *, JS_getVariables, (), {
  if (Castle.variables) {
    const result = Castle.variables;
    Castle.variables = null;
    return allocate(intArrayFromString(result), ALLOC_NORMAL);
  } else {
    return 0;
  };
});
JS_DEFINE(char *, JS_getNextCardSceneData, (), {
  if (Castle.nextCardSceneData) {
    const result = Castle.nextCardSceneData;
    Castle.nextCardSceneData = null;
    return allocate(intArrayFromString(result), ALLOC_NORMAL);
  } else {
    return 0;
  };
});
JS_DEFINE(char *, JS_getDeckId, (), {
  if (Castle.deckId) {
    return allocate(intArrayFromString(Castle.deckId), ALLOC_NORMAL);
  } else {
    return 0;
  };
});


//
// Constructor, destructor
//

Player::Player(Bridge &bridge_)
    : bridge(bridge_) {
}

Player::~Player() {
  clearState();
}

void Player::setScene(std::unique_ptr<Scene> scene_) {
  if (scene == nullptr) {
    // no previous scene existed, assume we are starting a new play session
    clock.reset();
  }
  scene = std::move(scene_);
}

void Player::clearState() {
  sound.removeAllClocks();
  setScene(nullptr);
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
  deckId = JS_getDeckId();

  if (auto sceneDataJson = JS_getNextCardSceneData()) {
    sceneArchive = Archive::fromJson(sceneDataJson);
    sceneArchive.read([&](Reader &reader) {
      reader.obj("snapshot", [&]() {
        setScene(std::make_unique<Scene>(bridge, variables, sound, clock, deckId, false, &reader));
      });
    });
    free(sceneDataJson);
  }
#endif
}

void Player::readScene(Reader &reader, std::optional<std::string> deckId_) {
  sceneArchive = Archive::fromJson(reader.toJson().c_str());
  deckId = deckId_;
  setScene(std::make_unique<Scene>(bridge, variables, sound, clock, deckId, false, &reader));
}

void Player::readScene(const std::string &readerJson, std::optional<std::string> deckId_) {
  sceneArchive = Archive::fromJson(readerJson.c_str());
  deckId = deckId_;
  sceneArchive.read([&](Reader &reader) {
    setScene(std::make_unique<Scene>(bridge, variables, sound, clock, deckId, false, &reader));
  });
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
        if (reader.has("snapshot")) {
          reader.obj("snapshot", [&]() {
            setScene(
                std::make_unique<Scene>(bridge, variables, sound, clock, deckId, false, &reader));
          });
        } else {
          setScene(
              std::make_unique<Scene>(bridge, variables, sound, clock, deckId, false, &reader));
        }
      });
    }

    Debug::display("fps: {}", lv.timer.getFPS());
    Debug::display("actors: {}", scene->numActors());

    scene->update(dt);
  }
}

void Player::draw() {
  if (scene) {
    scene->draw();
  }
}
