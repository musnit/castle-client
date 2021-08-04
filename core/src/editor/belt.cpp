#include "belt.h"

#include "behaviors/all.h"
#include "editor.h"
#include "library.h"


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

void Belt::select(std::string entryId) {
  selectedEntryId = std::move(entryId);
  auto elemIndex = 0;
  editor.getScene().getLibrary().forEachEntry([&](const LibraryEntry &entry) {
    if (entry.getEntryId() == *selectedEntryId) {
      targetIndex = elemIndex;
    }
    ++elemIndex;
  });
}

void Belt::updateSelection(bool forceGhostActorSelection) {
  auto currTime = lv.timer.getTime();
  auto &scene = editor.getScene();
  auto &library = scene.getLibrary();
  auto &selection = editor.getSelection();
  auto &selectedActorIds = selection.getSelectedActorIds();

  // Update `selectedEntryId` based on selected non-ghost actors
  if (!selectedActorIds.empty()) {
    // No work to do if already selected some selected actor's blueprint
    auto alreadySelected = false;
    if (selectedEntryId) {
      for (auto actorId : selectedActorIds) {
        if (auto parentEntryId = scene.maybeGetParentEntryId(actorId)) {
          if (parentEntryId == *selectedEntryId) {
            alreadySelected = true;
            break;
          }
        }
      }
    }
    if (!alreadySelected) {
      // Find a selected non-ghost actor
      for (auto actorId : selectedActorIds) {
        if (!scene.isGhost(actorId)) {
          if (auto parentEntryId = scene.maybeGetParentEntryId(actorId)) {
            select(parentEntryId);
            break;
          }
        }
      }
    }
  }

  // Ensure all ghost actors are created
  library.forEachEntry([&](LibraryEntry &entry) {
    entry.getGhostActorId();
  });

  // Select ghost actor based on `selectedEntryId`
  if (selectedEntryId) {
    // Don't select actors too rapidly
    if (forceGhostActorSelection || std::abs(cursorVX) < 10
        || currTime - lastGhostSelectTime > minGhostSelectPeriod) {
      // Don't need to select a ghost if some non-ghost actor is selected
      auto nonGhostActorSelected = false;
      for (auto actorId : editor.getSelection().getSelectedActorIds()) {
        if (!scene.isGhost(actorId)) {
          nonGhostActorSelected = true;
          break;
        }
      }
      if (!nonGhostActorSelected) {
        // Find ghost actor of selected entry, deselect all and select it if not already selected
        if (auto selectedEntry = library.maybeGetEntry(selectedEntryId->c_str())) {
          auto ghostActorId = selectedEntry->getGhostActorId();
          if (!selectedActorIds.contains(ghostActorId)) {
            auto savedSelectedEntryId = selectedEntryId; // Save and restore across deselect all
            selection.deselectAllActors();
            selectedEntryId = savedSelectedEntryId;
            selection.selectActor(ghostActorId);
            lastGhostSelectTime = currTime;
          }
        }
      }
    }
  }
}

void Belt::update(double dtDouble) {
  if (!editor.hasScene()) {
    return;
  }
  auto dt = float(dtDouble); // We mostly use `float`s, this avoids conversion warnings
  dt *= 1.6; // Make belt snappier. Resorted to making time faster after tuning constants...

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
  auto initialCursorX = -(elemSize + elemGap);
  if (firstFrame) {
    cursorX = initialCursorX;
  }

  // Save velocity at start of frame
  auto prevCursorVX = cursorVX;

  // Read touch input
  auto dragging = false; // Whether being actively dragged left or right to scroll
  auto &gesture = scene.getGesture();
  auto haveTouch = false;
  gesture.withSingleTouch([&](const Touch &touch) {
    haveTouch = true;

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
    auto touchData = maybeTouchData ? *maybeTouchData : TouchData { cursorVX };

    // Touching belt deselects actors
    if (touch.pressed) {
      selection.deselectAllActors(false);
    }

    // Find coordinates of touch in belt-space
    auto touchBeltX = touch.screenPos.x - 0.5f * windowWidth + cursorX;
    auto touchElemIndex = int(std::round(touchBeltX / (elemSize + elemGap)));

    // Cancel previous target on touch press, track new target on tap
    if (touch.pressed) {
      targetIndex = -1;
    }
    if (touch.released && !touch.movedNear && lv.timer.getTime() - touch.pressTime < 0.2) {
      if (std::abs(touchData.initialScrollVX) > elemSize / 1.2f) {
        // Scrolling pretty fast when touch began. Likely the user just wanted to stop the scroll
        // and didn't actually explicitly tap on a particular element. So don't select anything if
        // selection isn't currently active. If selection is active, target element under cursor
        // rather than element under touch.
        if (selectedEntryId) {
          auto cursorElemIndex = int(std::round(cursorX / (elemSize + elemGap)));
          auto cursorElemX = (elemSize + elemGap) * float(cursorElemIndex);
          if (cursorElemX < cursorX && touchData.initialScrollVX > 0) {
            ++cursorElemIndex;
          } else if (cursorElemX > cursorX && touchData.initialScrollVX < 0) {
            --cursorElemIndex;
          }
          targetIndex = std::min(std::max(0, cursorElemIndex), numElems - 1);
        }
      } else {
        // Scrolling slow, assume user meant to tap on the particular element under touch
        if (0 <= touchElemIndex && touchElemIndex < numElems) {
          targetIndex = touchElemIndex;
        } else {
          targetIndex = -1;
        }
        if (touchElemIndex == -1) {
          // Tapped one element before first one: the new blueprint button
          // TODO(nikki): Add new blueprint
        }
      }
    }

    // TODO(nikki): Enable highlight

    // Placing logic
    {
      // Track which element touch began on -- we'll use it if this turns into a placing touch
      if (touch.pressed) {
        if (0 <= touchElemIndex && touchElemIndex < numElems) {
          touchData.pressedElemIndex = touchElemIndex;
          touchData.pressedElemDelta = {
            getElementX(touchElemIndex) - touchBeltX,
            top + 0.5f * height - touch.screenPos.y,
          };
        }
      }

      // Start placing if the touch began on an element and it's a long-ish vertical drag
      if (!touchData.placed && !touchData.neverPlace && !touchData.placing
          && touchData.pressedElemIndex >= 0) {
        auto totalDelta = touch.screenPos - touch.initialScreenPos;
        auto isLong = totalDelta.getLengthSquare() > 0.25 * elemSize * 0.25 * elemSize;
        auto isVertical = touch.screenPos.y < top - 0.6 * height
            || std::abs(totalDelta.y) > 1.5 * std::abs(totalDelta.x);
        if (isLong && isVertical) {
          touchData.placing = true;
          placing = { touchData.pressedElemIndex };
        }
      }

      // Actually placing
      if (placing) {
        // Slow down scroll real quick
        cursorVX = 0.2f * cursorVX;

        // Update position of placed element
        placing->pos = touch.screenPos + touchData.pressedElemDelta;

        // Add actor if dragged far enough into scene
        // TODO(nikki): Skip if inspector sheet maximized
        if (touch.screenPos.y < top - 2 * height) {
          if (auto entry = library.indexEntry(placing->elemIndex)) {
            // Add actor to scene
            Scene::ActorDesc actorDesc;
            actorDesc.parentEntryId = entry->getEntryId().c_str();
            auto actorId = scene.addActor(actorDesc);

            // Position at touch
            auto &bodyBehavior = scene.getBehaviors().byType<BodyBehavior>();
            if (bodyBehavior.hasComponent(actorId)) {
              bodyBehavior.setProperty(
                  actorId, decltype(BodyComponent::Props::x)::id, touch.pos.x, false);
              bodyBehavior.setProperty(
                  actorId, decltype(BodyComponent::Props::y)::id, touch.pos.y, false);
            }

            // Select actor and switch to grab tool
            selection.deselectAllActors();
            selection.selectActor(actorId);
            editor.setCurrentTool(Editor::Tool::Grab);
            touch.forceUse(GrabTool::touchToken);
          }

          // Clear placing state
          touchData.placing = false;
          touchData.placed = true;
          placing = {};
        }
      }

      // TODO(nikki): Undo placing if dragged back into belt
      // TODO(nikki): Command with final placed actor location
    }

    // Dragging to scroll if not placing
    if (!(touchData.placing || touchData.placed)) {
      dragging = true;

      // Directly move belt by dragged amount
      auto dx = -touch.screenDelta.x;
      cursorX += dx;

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
      if (touchInBelt && std::abs(touch.screenPos.x - touch.initialScreenPos.x) > 0.8 * elemSize) {
        touchData.neverPlace = true;
      }
    }

    // Put belt data back in touch
    gesture.setData<TouchData>(touch.id, touchData);
  });
  if (!haveTouch) {
    // Clear placing state on touch release
    placing = {};
  }

  if (auto maybeTargetEntry = library.indexEntry(targetIndex)) {
    // Have a target element

    // Select target
    selectedEntryId = maybeTargetEntry->getEntryId(); // TODO(nikki): Avoid unnecessary copying

    // Scroll to target
    auto targetElemX = float(targetIndex) * (elemSize + elemGap);
    if (std::abs(targetElemX - cursorX) <= 3) {
      // Reached target
      targetIndex = -1;
      cursorX = targetElemX;
      cursorVX = 0;
    } else {
      // Rubber band to target
      cursorX = 0.4f * targetElemX + 0.6f * cursorX;
    }
  } else {
    // Don't have a target element
    targetIndex = -1;

    // If selection active, update based on cursor position
    if (selectedEntryId) {
      auto cursorElemIndex = int(std::round(cursorX / (elemSize + elemGap)));
      if (auto cursorEntry = library.indexEntry(cursorElemIndex)) {
        // TODO(nikki): Enable highlight if entry changed
        selectedEntryId = cursorEntry->getEntryId(); // TODO(nikki): Avoid unnecessary copying
      }
    }

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

    // Snap to nearest element
    if (selectedEntryId && !rubberbanding && !dragging) {
      constexpr auto thresholdVX = 200;
      if (auto cursorVXLen = std::abs(cursorVX); cursorVXLen <= thresholdVX) {
        auto nearestElemX = (elemSize + elemGap) * std::round(cursorX / (elemSize + elemGap));
        if (cursorVXLen > 0.7 * thresholdVX) {
          // Don't 'pull back' if we're moving forward fast enough
          if (nearestElemX < cursorX && cursorVX > 0) {
            nearestElemX = std::max(cursorX, nearestElemX + 0.8f * (elemSize + elemGap));
          }
          if (nearestElemX > cursorX && cursorVX < 0) {
            nearestElemX = std::min(cursorX, nearestElemX - 0.8f * (elemSize + elemGap));
          }
        }

        // Apply an acceleration toward nearest element, but damp the velocity change
        auto accel = 0.7f * thresholdVX * (nearestElemX - cursorX);
        auto newVX = cursorVX + accel * std::min(dt, 0.038f);
        cursorVX = 0.85f * newVX + 0.15f * cursorVX;
      }
    }

    // Apply velocity unless directly dragged
    if (!dragging) {
      cursorX += cursorVX * dt;
    }

    // Deceleration, stopping at proper zero if we get there
    constexpr float decel = 2200;
    if (cursorVX > 0) {
      cursorVX = std::max(0.0f, cursorVX - decel * dt);
    } else if (cursorVX < 0) {
      cursorVX = std::min(0.0f, cursorVX + decel * dt);
    }

    // Smooth out velocity artifacts
    if (cursorVX != 0) {
      cursorVX = 0.8f * cursorVX + 0.2f * prevCursorVX;
    }
  }

  // TODO(nikki): Disable highlight when not selecting blueprint

  updateSelection();

  firstFrame = false;
}


//
// Draw
//

void Belt::drawOverlay() const {
  Debug::display(
      "belt selected entry id: {}", selectedEntryId ? selectedEntryId->c_str() : "(none)");

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

  // Elements
  {
    const auto drawElem = [&](const LibraryEntry &entry, const love::Vector2 &pos) {
      if (auto image = entry.getPreviewImage()) {
        auto imgW = float(image->getWidth());
        auto imgH = float(image->getHeight());
        auto scale = std::min(elemSize / imgW, elemSize / imgH);
        image->draw(&lv.graphics,
            love::Matrix4(pos.x, pos.y, 0, scale, scale, 0.5f * imgW, 0.5f * imgH, 0, 0));
      }
    };
    auto elemIndex = 0;
    library.forEachEntry([&](const LibraryEntry &entry) {
      if (!(placing && placing->elemIndex == elemIndex)) {
        auto elemX = getElementX(elemIndex);
        drawElem(entry, { 0.5f * windowWidth + elemX - cursorX, elemsY });
      }
      ++elemIndex;
    });
    if (placing) {
      if (auto entry = library.indexEntry(placing->elemIndex)) {
        drawElem(*entry, { placing->pos.x, placing->pos.y });
      }
    }
  }

  // Selection box
  if (selectedEntryId) {
    // TODO(nikki): Draw light box when actor also selected
    lv.graphics.setColor({ 0, 0, 0, 0.78 });
    lv.graphics.setLineWidth(2.6f * float(lv.graphics.getScreenDPIScale()));
    auto boxSize = 1.08f * elemSize;
    lv.graphics.rectangle(love::Graphics::DRAW_LINE, 0.5f * windowWidth - 0.5f * boxSize,
        elemsY - 0.5f * boxSize, boxSize, boxSize, 0.04f * boxSize, 0.04f * boxSize);
  }

  // New blueprint button
  {
    auto buttonX = 0.5f * windowWidth - (elemSize + elemGap) - cursorX;

    // Circle
    auto buttonRadius = 0.7f * 0.5f * elemSize;
    lv.graphics.setColor({ 0, 0, 0, 0.78 });
    lv.graphics.circle(love::Graphics::DRAW_FILL, buttonX, elemsY, buttonRadius);

    // Plus
    auto plusRadius = 0.5f * buttonRadius;
    lv.graphics.setColor({ 1, 1, 1, 1 });
    lv.graphics.setLineWidth(0.04f * elemSize);
    std::array horizontal {
      love::Vector2(buttonX - plusRadius, elemsY),
      love::Vector2(buttonX + plusRadius, elemsY),
    };
    lv.graphics.polyline(horizontal.data(), horizontal.size());
    std::array vertical {
      love::Vector2(buttonX, elemsY - plusRadius),
      love::Vector2(buttonX, elemsY + plusRadius),
    };
    lv.graphics.polyline(vertical.data(), vertical.size());
  }

  lv.graphics.pop();

  // Draw touches for debugging
  constexpr auto drawTouches = true;
  if constexpr (drawTouches) {
    lv.graphics.push(love::Graphics::STACK_ALL);
    lv.graphics.setColor({ 1, 0, 1, 0.5 });
    scene.getGesture().forEachTouch([&](const Touch &touch) {
      lv.graphics.circle(love::Graphics::DRAW_FILL, touch.screenPos.x, touch.screenPos.y, 20);
    });
    lv.graphics.pop();
  }
}
