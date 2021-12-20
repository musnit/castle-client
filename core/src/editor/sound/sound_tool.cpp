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
}
