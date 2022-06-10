#pragma once

#include "scene.h"

enum ScreenType {
  FEED,
  PLAYER,
  EDITOR,
};

class Screen {
public:
  Screen() = default;
  virtual ~Screen() = default;
  virtual ScreenType screenType() = 0;
  virtual void update(double dt) = 0;
  virtual void draw() = 0;
  virtual void suspend() = 0;
  virtual void resume() = 0;
  virtual void clearState() = 0;
  virtual void clearFeed(bool isViewSource) {
  }
  virtual void lowMemory() {
  }
  virtual bool hasScene() = 0;
  virtual Scene &getScene() = 0;

  // Not needed by feed
  virtual void readScene(Reader &reader, std::optional<std::string> deckId) {
  }
  virtual void readVariables(Reader &reader) {
  }

  // Only needed in editor
  virtual bool androidHandleBackPressed() {
    return false;
  }

  // Only used by feed
  virtual void setWindowSize(int w, int h) {
  }
};
