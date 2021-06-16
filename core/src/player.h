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

  explicit Player(Bridge &bridge_, Lv &lv_);

  void update(double dt);
  void draw();

  void readScene(Reader &reader);
  void readVariables(Reader &reader);
  Variables &getVariables();

private:
  Bridge &bridge;
  Lv &lv;

  void tryLoadVariables();
  void tryLoadNextCard();

  Variables variables;

  Archive sceneArchive;
  std::unique_ptr<Scene> scene;
  
  std::unique_ptr<love::Font> debugFont { lv.graphics.newDefaultFont(
      22, love::TrueTypeRasterizer::HINTING_NORMAL) };
};
