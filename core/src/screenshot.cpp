#include "screenshot.h"

Screenshot::Screenshot(int width) {
  assert(width > 0 && "Can't create a Screenshot with zero width.");
  drawingOptions.windowWidth = width;
}

Screenshot::~Screenshot() {
  if (canvas) {
    delete canvas;
    canvas = nullptr;
  }
}

std::string Screenshot::getBase64Screenshot(Scene *scene) {
  if (!canvas) {
    constexpr auto viewHeightToWidthRatio = 7.0f / 5.0f;
    canvas = love::DrawDataFrame::newCanvas(
        drawingOptions.windowWidth, drawingOptions.windowWidth * viewHeightToWidthRatio);
  }
  love::DrawDataFrame::renderToCanvas(canvas, [scene, this]() {
    scene->draw(drawingOptions);
  });
  return love::DrawDataFrame::encodeBase64Png(canvas);
}
