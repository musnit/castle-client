#include "sound_tool.h"
#include "editor/editor.h"

// TODO: receive event indicating which pattern to edit
// expect this before onSetActive()

SoundTool::SoundTool(Editor &editor_)
    : editor(editor_) {
  resetState();
}

void SoundTool::resetState() {
  pattern = nullptr;

  // TODO: delete mock data
  pattern = std::make_shared<Pattern>();
}

void SoundTool::onSetActive() {
}

void SoundTool::update(double dt) {
  if (!editor.hasScene()) {
    return;
  }
  if (!hasPattern()) {
    return;
  }
  auto &scene = editor.getScene();
  const Gesture &gesture = scene.getGesture();
  if (gesture.getCount() == 1 && gesture.getMaxCount() == 1) {
    gesture.withSingleTouch([&](const Touch &touch) {
      love::Vector2 originalTouchPosition = { touch.screenPos.x, touch.screenPos.y };
      auto transformedTouchPosition = viewTransform.inverseTransformPoint(originalTouchPosition);

      if (touch.pressed) {
        // grid x is step, grid y is key
        auto step = floor(transformedTouchPosition.x / gridCellSize);
        auto key = floor(-transformedTouchPosition.y / gridCellSize);
        pattern->toggleNote(double(step), key);
      }
    });
  }
}

void SoundTool::drawGrid(float viewScale) {
  // TODO: final grid appearance
  lv.graphics.setColor({ 0.0f, 0.0f, 0.0f, 0.4f });
  auto gridDotRadius = 3.5f;
  love::Vector2 viewPosition(0.0f, -0.75f * SOUND_DEFAULT_VIEW_WIDTH);
  love::Vector2 gridOffset(0.0f, 0.0f);
  grid.draw(gridCellSize, 10.0f + gridCellSize * 0.5f, viewScale, viewPosition, gridOffset,
      gridDotRadius, false);

  lv.graphics.setColor({ 1.0f, 1.0f, 1.0f, 1.0f });
  grid.draw(gridCellSize, 10.0f + gridCellSize * 0.5f, viewScale, viewPosition, gridOffset,
      gridDotRadius, true);
};

void SoundTool::drawPattern() {
  if (!hasPattern()) {
    return;
  }

  love::Colorf noteColor { 0.3f, 0.3f, 0.3f, 1.0f };
  lv.graphics.setColor(noteColor);

  for (auto &[time, notes] : *pattern) {
    auto x = time * gridCellSize;
    for (auto &note : notes) {
      auto y = (note.key * -gridCellSize) - gridCellSize;
      lv.graphics.rectangle(love::Graphics::DrawMode::DRAW_FILL, x, y, gridCellSize, gridCellSize);
    }
  }
}

void SoundTool::drawOverlay() {
  auto viewScale = 800.0f / SOUND_DEFAULT_VIEW_WIDTH;
  love::Vector2 viewPosition(0.0f, -0.75f * SOUND_DEFAULT_VIEW_WIDTH);

  lv.graphics.push(love::Graphics::STACK_ALL);
  viewTransform.reset();
  viewTransform.scale(viewScale, viewScale);
  viewTransform.translate(-viewPosition.x, -viewPosition.y);
  lv.graphics.applyTransform(&viewTransform);

  love::Colorf clearColor { 0.8f, 0.8f, 0.8f, 1.0f };
  lv.graphics.clear(clearColor, {}, {});
  lv.graphics.setLineWidth(0.1f);

  drawGrid(viewScale);
  drawPattern();

  // TODO: next
  // work on pattern prop/serialization/save

  lv.graphics.pop();
}
