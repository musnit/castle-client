#pragma once

#include "precomp.h"
#include "lv.h"
#include "bridge.h"
#include "scene.h"
#include "variables.h"

class Player {
  // manages a scene instance that is being played (not edited).

public:
  Player(const Player &) = delete; // Prevent accidental copies
  const Player &operator=(const Player &) = delete;

  explicit Player(Bridge &bridge_);

  void update(double dt);
  void draw();

  void readScene(Reader &reader);
  void readVariables(Reader &reader);
  Variables &getVariables();
  bool hasScene();
  Scene &getScene();

private:
  Lv &lv { Lv::getInstance() };
  Bridge &bridge;

  void tryLoadVariables();
  void tryLoadNextCard();

  Variables variables;

  Archive sceneArchive;
  std::unique_ptr<Scene> scene;
};

inline bool Player::hasScene() {
  return !!scene;
}

inline Scene &Player::getScene() {
  return *scene;
}
