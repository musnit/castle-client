#pragma once

#include "precomp.h"
#include "props.h"

#include "lv.h"


class Editor;

class Belt {
public:
  Belt(const Belt &) = delete; // Prevent accidental copies
  const Belt &operator=(const Belt &) = delete;

  explicit Belt(Editor &editor_);

  void deselect();
  void updateSelection(bool forceGhostActorSelection = false);

  void update(double dt);
  void drawOverlay() const;


private:
  Lv &lv { Lv::getInstance() };

  Editor &editor;

  std::optional<std::string> selectedEntryId;

  bool firstFrame = true;

  float height = 0;
  float top = 0, bottom = 0;
  float elemSize = 0;

  float cursorX = 0;
  float cursorVX = 0;

  int targetIndex = -1;

  SmallVector<float, 5> dragVXs;

  struct TouchData {
    // Extra data we add to touches
    float initialScrollVX = 0; // The belt scroll velocity right before this touch began
    bool neverPlace = false; // Whether to never allow placing actors from this touch
  };

  static constexpr double minGhostSelectPeriod = 0.2;
  double lastGhostSelectTime = lv.timer.getTime() - minGhostSelectPeriod - 0.1;


  float getElementX(int index) const;
};


// Inlined implementations

inline void Belt::deselect() {
  selectedEntryId = {};
}
