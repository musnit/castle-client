#include "physics_body_data.h"

std::string PhysicsBodyData::renderPreviewPng() {
  int size = 256;
  auto previewCanvas = love::DrawDataFrame::newCanvas(size, size);

  // TODO: we could find the bounds and scale this up to fit the canvas better
  love::DrawDataFrame::renderToCanvas(previewCanvas, [this, size]() {
    auto width = DRAW_MAX_SIZE * 2.0f;
    auto height = DRAW_MAX_SIZE * 2.0f;
    auto maxDimension = std::fmaxf(width, height);
    lv.graphics.push(love::Graphics::STACK_ALL);
    lv.graphics.origin();
    lv.graphics.scale(size / maxDimension, size / maxDimension);
    lv.graphics.clear(love::Colorf(1, 1, 1, 1), {}, {});
    lv.graphics.setColor({ 0, 0, 0, 1 });
    lv.graphics.translate(DRAW_MAX_SIZE, DRAW_MAX_SIZE);
    render();
    lv.graphics.pop();
  });
  auto result = love::DrawDataFrame::encodeBase64Png(previewCanvas);
  delete previewCanvas;
  return result;
}

void PhysicsBodyData::updatePreview() {
  base64Png = renderPreviewPng();
}
