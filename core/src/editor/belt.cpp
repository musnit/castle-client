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

void Belt::update(double dt) {
  if (!editor.hasScene()) {
    return;
  }
  auto &scene = editor.getScene();

  // Basic layout
  auto windowHeight = float(lv.graphics.getHeight());
  height = beltHeightFraction * windowHeight;
  top = windowHeight - height;
  elemSize = height - 30;
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

  lv.graphics.setColor({ 1, 1, 1, 1 });
  lv.graphics.rectangle(love::Graphics::DRAW_FILL, 0, top, windowWidth, height);

  auto elemsY = top + 0.5f * height;

  float elemIndex = 0;
  library.forEachEntry([&](const LibraryEntry &entry) {
    auto elemX = elemIndex * (elemSize + elemGap);

    Debug::display("elemX: {}", elemX);

    auto x = 0.5f * windowWidth + elemX - cursorX;
    auto y = elemsY;

    //lv.graphics.push(love::Graphics::STACK_ALL);
    //lv.graphics.setColor({ 1, 0, 0, 1 });
    //lv.graphics.rectangle(
    //    love::Graphics::DRAW_FILL, x - 0.5f * elemSize, y - 0.5f * elemSize, elemSize, elemSize);
    //lv.graphics.pop();

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
