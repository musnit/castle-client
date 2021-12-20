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
}

void SoundTool::onSetActive() {
}

void SoundTool::update(double dt) {
  if (!editor.hasScene()) {
    return;
  }

  // TODO: gestures to edit pattern
}

void SoundTool::drawOverlay() {
  // TODO: render edit pattern
  lv.graphics.push(love::Graphics::STACK_ALL);

  love::Colorf clearColor { 1.0f, 0.0f, 0.0f, 1.0f };
  love::Colorf drawColor { 0.0f, 0.0f, 0.0f, 1.0f };
  lv.graphics.clear(clearColor, {}, {});
  lv.graphics.setColor(drawColor);
  lv.graphics.circle(love::Graphics::DrawMode::DRAW_FILL, 0.0f, 0.0f, 1.0f);

  lv.graphics.pop();
}
