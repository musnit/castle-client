#include "screenshot.h"

Screenshot::Screenshot(int width) {
  assert(width > 0 && "Can't create a Screenshot with zero width.");
  drawingOptions.windowWidth = float(width);
}

Screenshot::~Screenshot() {
  if (canvas) {
    delete canvas;
    canvas = nullptr;
  }
}

void Screenshot::renderScreenshotToCanvas(Scene *scene) {
  if (!canvas) {
    constexpr auto viewHeightToWidthRatio = 7.0f / 5.0f;
    canvas = love::DrawDataFrame::newCanvas(
        int(drawingOptions.windowWidth), int(drawingOptions.windowWidth * viewHeightToWidthRatio));
  }
  love::DrawDataFrame::renderToCanvas(canvas, [scene, this]() {
    scene->draw(drawingOptions);
  });
}

std::string Screenshot::getBase64Screenshot(Scene *scene) {
  renderScreenshotToCanvas(scene);
  return love::DrawDataFrame::encodeBase64Png(canvas);
}

love::image::ImageData *Screenshot::getScreenshotImageData(Scene *scene) {
  renderScreenshotToCanvas(scene);
  return love::DrawDataFrame::newImageData(canvas);
}
