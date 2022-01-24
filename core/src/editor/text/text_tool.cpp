#include "text_tool.h"
#include "editor/editor.h"

TextTool::TextTool(Editor &editor_)
    : editor(editor_) {
  resetState();
}

void TextTool::resetState() {
}

void TextTool::onSetActive() {
}

void TextTool::drawOverlay() {
  love::Colorf clearColor { 0.8f, 0.8f, 0.8f, 1.0f };
  lv.graphics.clear(clearColor, {}, {});
}
