#include "belt.h"

#include "behaviors/all.h"
#include "editor.h"


static const TouchToken beltTouchToken;

static constexpr float beltHeightFraction = 0.10588235294117648; // TODO: Get from JS

static constexpr float elemGap = 20;


//
// Constructor, destructor
//

Belt::Belt(Editor &editor_)
    : editor(editor_) {
}


//
// Update
//

float Belt::getElementX(int index) const {
  return float(index) * (elemSize + elemGap);
}

void Belt::update(double dtDouble) {
  if (!editor.hasScene()) {
    return;
  }
  auto dt = float(dtDouble); // We mostly use `float`s, this avoids conversion warnings

  // Get scene data
  auto &scene = editor.getScene();
  auto &library = scene.getLibrary();
  auto &selection = editor.getSelection();
  auto numElems = library.numEntries();

  // Basic layout
  auto windowWidth = float(lv.graphics.getWidth());
  auto windowHeight = float(lv.graphics.getHeight());
  height = beltHeightFraction * windowHeight;
  bottom = windowHeight;
  top = bottom - height;
  elemSize = height - 30;

  // Initial cursor position
  float initialCursorX = -(elemSize + elemGap);
  if (firstFrame) {
    cursorX = initialCursorX;
  }

  // Animation constants
  constexpr float decelX = 2200;

  // Animation state
  auto dragging = false; // Whether being actively dragged left or right to scroll
  auto targeting = false; // Whether scrolling to a targetted element
  auto skipApplyVel = false; // Whether to skip applying velocity

  // Save previous X and VX
  // auto prevCursorX = cursorX;
  auto prevCursorVX = cursorVX;

  // Read touch input
  auto &gesture = scene.getGesture();
  gesture.withSingleTouch([&](const Touch &touch) {
    auto touchInBelt = top <= touch.screenPos.y && touch.screenPos.y <= bottom;

    // Check if we are using or can use this touch
    if (!touch.isUsed(beltTouchToken)) {
      if (touch.isUsed()) {
        return; // Used by something else
      }
      if (!touchInBelt) {
        return; // Outside belt
      }
      touch.forceUse(beltTouchToken);
    }

    // Get belt data for touch
    auto maybeTouchData = gesture.maybeGetData<TouchData>(touch.id);
    auto touchData = maybeTouchData ? *maybeTouchData : TouchData();

    // Touching belt deselects actors
    selection.deselectAllActors();

    // Find coordinates of touch in belt-space
    auto touchBeltX = touch.screenPos.x - 0.5f * windowWidth + cursorX;
    auto touchElemIndex = int(std::round(touchBeltX / (elemSize + elemGap)));

    // TODO(nikki): Press: cancel target
    // TODO(nikki): Tap: track new target
    // TODO(nikki): Enable highlight

    // TODO(nikki): Track placing info

    // Dragging to scroll if not placing
    {
      dragging = true;

      // Directly move belt by dragged amount, don't apply velocity
      auto dx = -touch.screenDelta.x;
      cursorX += dx;
      skipApplyVel = true;

      // Keep track of last 3 drag velocities and use max to smooth things out
      dragVXs.push_back(dx / dt);
      while (dragVXs.size() > 3) {
        dragVXs.erase(dragVXs.begin());
      }
      cursorVX = 0;
      for (auto vx : dragVXs) {
        if (std::abs(vx) > std::abs(cursorVX)) {
          cursorVX = vx;
        }
      }

      // If touch moves far enough along X without exiting belt, never place from the touch
      if (touchInBelt && std::abs(touch.screenPos.x - touch.initialScreenPos.x) > 1.2 * elemSize) {
        touchData.neverPlace = true;
      }
    }

    // TODO(nikki): Placing logic

    // Put belt data back in touch
    gesture.setData<TouchData>(touch.id, touchData);
  });
  // TODO(nikki): Clear placing info if not placing

  // TODO(nikki): Scroll to target
  // TODO(nikki): Update currently selected entry id

  // Apply non-targeting physics
  if (!targeting) {
    // Strong rubber band on ends
    auto rubberbanding = false;
    if (!dragging) {
      if (numElems == 0) {
        // No elements: rubber band to initial position
        cursorVX = 0.5f * cursorVX;
        cursorX = 0.85f * cursorX + 0.15f * initialCursorX;
        rubberbanding = true;
      } else {
        // Have elements: check if beyond bounds
        if (cursorX < 0) {
          cursorVX = 0.5f * cursorVX;
          cursorX = 0.85f * cursorX;
          rubberbanding = true;
        }
        if (auto maxX = getElementX(numElems - 1); cursorX > maxX) {
          cursorVX = 0.5f * cursorVX;
          cursorX = 0.85f * cursorX + 0.15f * maxX;
          rubberbanding = true;
        }
      }
    }

    // TODO(nikki): Snap cursor to nearest elem

    // Apply velocity
    if (!skipApplyVel) {
      cursorX += cursorVX * dt;
    }

    // Deceleration, stopping at proper zero if we get there
    if (cursorVX > 0) {
      cursorVX = std::max(0.0f, cursorVX - decelX * dt);
    } else if (cursorVX < 0) {
      cursorVX = std::min(0.0f, cursorVX + decelX * dt);
    }

    // Smooth out velocity artifacts
    if (cursorVX != 0) {
      cursorVX = 0.8f * cursorVX + 0.2f * prevCursorVX;
    }
  }

  // TODO(nikki): Haptics

  // TODO(nikki): Disable highlight when not selecting blueprint

  firstFrame = false;
}


//
// Draw
//

void Belt::drawOverlay() const {
  if (!editor.hasScene()) {
    return;
  }
  auto &scene = editor.getScene();
  auto &library = scene.getLibrary();

  lv.graphics.push(love::Graphics::STACK_ALL);

  auto windowWidth = float(lv.graphics.getWidth());

  // Background
  lv.graphics.setColor({ 1, 1, 1, 1 });
  lv.graphics.rectangle(love::Graphics::DRAW_FILL, 0, top, windowWidth, height);

  auto elemsY = top + 0.5f * height;

  // Each element
  auto elemIndex = 0;
  library.forEachEntry([&](const LibraryEntry &entry) {
    auto elemX = getElementX(elemIndex);

    auto x = 0.5f * windowWidth + elemX - cursorX;
    auto y = elemsY;

    if (auto image = entry.getPreviewImage()) {
      auto imgW = float(image->getWidth());
      auto imgH = float(image->getHeight());
      auto scale = std::min(elemSize / imgW, elemSize / imgH);
      image->draw(
          &lv.graphics, love::Matrix4(x, y, 0, scale, scale, 0.5f * imgW, 0.5f * imgH, 0, 0));
    }

    ++elemIndex;
  });

  lv.graphics.pop();
}
