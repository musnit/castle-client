#include "image_processing.h"

love::image::ImageData *ImageProcessing::fitToMaxSize(love::image::ImageData *data, int maxSize) {
  auto img = love::DrawDataFrame::imageDataToImage(data);
  auto width = img->getWidth(), height = img->getHeight();
  auto scale = std::min(1.0f, std::min(float(maxSize) / width, float(maxSize) / height));
  auto resizeCanvas = love::DrawDataFrame::newCanvas(width * scale, height * scale);
  love::DrawDataFrame::renderToCanvas(resizeCanvas, [img, scale, width, height]() {
    auto &lv = Lv::getInstance();
    lv.graphics.push(love::Graphics::STACK_ALL);
    lv.graphics.setColor({ 1, 1, 1, 1 });

    img->draw(&lv.graphics, love::Matrix4(0, 0, 0, scale, scale, 0, 0, 0, 0));
    lv.graphics.pop();
  });
  img->release();
  auto result = love::DrawDataFrame::newImageData(resizeCanvas);
  resizeCanvas->release();
  return result;
}
