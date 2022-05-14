#pragma once

#include "precomp.h"
#include "props.h"

#include "lv.h"
#include "gesture.h"


class Editor;

class Belt {
public:
  Belt(const Belt &) = delete; // Prevent accidental copies
  const Belt &operator=(const Belt &) = delete;

  explicit Belt(Editor &editor_);

  void deselect();
  void select(std::string entryId);
  void updateSelection(bool forceGhostActorSelection = false);

  void enableHighlight();

  void update(double dt);
  void drawHighlight() const;
  void drawOverlay() const;

  inline static const TouchToken placedTouchToken; // Actor being grabbed after placing
  bool isInside(const Touch &touch) const;

  inline static float heightFraction = 0.102; // Static to allow setting before instance initialized
  float getHeight();

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
    int pressedElemIndex = -1; // Index of element the touch began on
    love::Vector2 pressedElemDelta = { 0, 0 }; // Relative position from touch to above element
    bool placing = false; // Whether placing has started using this touch
    bool placed = false; // Whether placing was started and finished using this touch
  };

  static constexpr double minGhostSelectPeriod = 0.2;
  double lastGhostSelectTime = lv.timer.getTime() - minGhostSelectPeriod - 0.1;

  struct Placing {
    int elemIndex = -1;
    love::Vector2 pos = { 0, 0 };
  };
  std::optional<Placing> placing;


  bool highlightEnabled = false;

  inline static std::unique_ptr<love::Shader> highlightShader;
  inline static std::unique_ptr<love::Shader> outlineShader;
  inline static std::unique_ptr<love::Shader> outlineThickeningShader;

  inline static std::unique_ptr<love::Canvas> highlightCanvas;
  inline static std::unique_ptr<love::Canvas> highlightCanvas2;


  float getElementX(int index) const;
};


// Inlined implementations

inline void Belt::deselect() {
  selectedEntryId = {};
}

inline void Belt::enableHighlight() {
  highlightEnabled = true;
}

inline bool Belt::isInside(const Touch &touch) const {
  return top <= touch.screenPos.y && touch.screenPos.y <= bottom;
}

inline float Belt::getHeight() {
  return height;
}
