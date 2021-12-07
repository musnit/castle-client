#include "image_processing.h"
#include "util.h"

love::image::ImageData *ImageProcessing::fitToMaxSize(love::image::ImageData *data, int maxSize) {
  auto img = love::DrawDataFrame::imageDataToImage(data);
  auto width = img->getWidth(), height = img->getHeight();
  auto scale = std::min(1.0f, std::min(float(maxSize) / width, float(maxSize) / height));

  // love::graphics::Texture::Filter f = img->getFilter();
  // f.min = graphics::Texture::FILTER_LINEAR;
  // f.mag = graphics::Texture::FILTER_LINEAR;
  love::graphics::Texture::Filter filter { love::graphics::Texture::FILTER_LINEAR,
    love::graphics::Texture::FILTER_LINEAR, love::graphics::Texture::FILTER_NONE, 1.0f };
  img->setFilter(filter);

  auto resizeCanvas = love::DrawDataFrame::newCanvas(width * scale, height * scale);
  resizeCanvas->setFilter(filter);

  love::DrawDataFrame::renderToCanvas(resizeCanvas, [img, scale]() {
    auto &lv = Lv::getInstance();
    lv.graphics.push(love::Graphics::STACK_ALL);
    lv.graphics.clear(love::Colorf(0, 0, 0, 0), {}, {});
    lv.graphics.setColor({ 1, 1, 1, 1 });

    img->draw(&lv.graphics, love::Matrix4(0, 0, 0, scale, scale, 0, 0, 0, 0));
    lv.graphics.pop();
  });
  img->release();
  auto result = love::DrawDataFrame::newImageData(resizeCanvas);
  resizeCanvas->release();
  return result;
}

love::image::ImageData *ImageProcessing::fitToSize(love::image::ImageData *data, int maxSize) {
  auto img = love::DrawDataFrame::imageDataToImage(data);
  auto width = img->getWidth(), height = img->getHeight();
  auto scale = float(maxSize) / std::max(float(width), float(height));

  love::graphics::Texture::Filter filter { love::graphics::Texture::FILTER_NEAREST,
    love::graphics::Texture::FILTER_NEAREST, love::graphics::Texture::FILTER_NONE, 1.0f };
  img->setFilter(filter);

  auto resizeCanvas = love::DrawDataFrame::newCanvas(width * scale, height * scale);
  resizeCanvas->setFilter(filter);

  love::DrawDataFrame::renderToCanvas(resizeCanvas, [img, scale]() {
    auto &lv = Lv::getInstance();
    lv.graphics.push(love::Graphics::STACK_ALL);
    lv.graphics.clear(love::Colorf(0, 0, 0, 0), {}, {});
    lv.graphics.setColor({ 1, 1, 1, 1 });

    img->draw(&lv.graphics, love::Matrix4(0, 0, 0, scale, scale, 0, 0, 0, 0));
    lv.graphics.pop();
  });
  img->release();
  auto result = love::DrawDataFrame::newImageData(resizeCanvas);
  resizeCanvas->release();
  return result;
}

bool sumPixel(love::image::Pixel &p, float *sum, love::PixelFormat format, bool includeAlpha) {
  int n = 3;
  if (includeAlpha) {
    n = 4;
  }
  switch (format) {
  case love::PixelFormat::PIXELFORMAT_RGBA8:
    for (int i = 0; i < n; i++) {
      sum[i] += float(p.rgba8[i]);
    }
    return true;
  case love::PixelFormat::PIXELFORMAT_RGBA16:
    for (int i = 0; i < n; i++) {
      sum[i] += float(p.rgba16[i]);
    }
    return true;
  case love::PixelFormat::PIXELFORMAT_RGBA16F:
    for (int i = 0; i < n; i++) {
      sum[i] += float(p.rgba16f[i]);
    }
    return true;
  case love::PixelFormat::PIXELFORMAT_RGBA32F:
    for (int i = 0; i < n; i++) {
      sum[i] += float(p.rgba32f[i]);
    }
    return true;
  default:
    return false;
  }
}

bool setChannel(love::image::Pixel &p, int channel, float val, love::PixelFormat format) {
  switch (format) {
  case love::PixelFormat::PIXELFORMAT_RGBA8:
    p.rgba8[channel] = uint8(val);
    return true;
  case love::PixelFormat::PIXELFORMAT_RGBA16:
    p.rgba16[channel] = uint16(val);
    return true;
  case love::PixelFormat::PIXELFORMAT_RGBA16F:
    p.rgba16f[channel] = love::half(val);
    return true;
  case love::PixelFormat::PIXELFORMAT_RGBA32F:
    p.rgba32f[channel] = val;
    return true;
  default:
    return false;
  }
}

void ImageProcessing::kMeans(love::image::ImageData *data, uint8 k, int numIterations) {
  auto width = data->getWidth(), height = data->getHeight();
  auto format = data->getFormat();

  // pick k means at random from the existing data
  love::RandomGenerator rng;
  auto means = new love::image::Pixel[k];
  for (auto cluster = 0; cluster < k; cluster++) {
    data->getPixel(rng.rand() % width, rng.rand() % height, means[cluster]);
  }

  auto whichCluster = new uint8[width * height];
  auto clusterSum = new float[3 * k];
  auto clusterSize = new int[k];
  for (auto ii = 0; ii < numIterations; ii++) {
    // reset newly computed means
    memset(clusterSum, 0, sizeof(float) * 3 * k);
    memset(clusterSize, 0, sizeof(int) * k);

    // assign each pixel to the segment with the nearest mean
    love::image::Pixel p {};
    float rgba1[4];
    float rgba2[4];
    for (auto y = 0; y < height; y++) {
      for (auto x = 0; x < width; x++) {
        data->getPixel(x, y, p);
        DrawUtil::getRGBAFloat(p, format, rgba1);

        if (rgba1[3] < 2.56f) {
          // near-transparent, always group in special k+1 cluster regardless of color
          whichCluster[y * width + x] = k;
        } else {
          float minDist = std::numeric_limits<float>::max();
          uint8 closestCluster = k;
          for (uint8 cluster = 0; cluster < k; cluster++) {
            DrawUtil::getRGBAFloat(means[cluster], format, rgba2);
            auto dist = DrawUtil::distanceSquared(rgba1, rgba2);
            if (dist < minDist) {
              minDist = dist;
              closestCluster = cluster;
            }
          }
          whichCluster[y * width + x] = closestCluster;
          sumPixel(p, clusterSum + closestCluster * 3, format, false);
          clusterSize[closestCluster]++;
        }
      }
    }

    // for each cluster, recompute mean from member pixels
    for (auto cluster = 0; cluster < k; cluster++) {
      for (int i = 0; i < 3; i++) {
        float mean = clusterSum[cluster * 3 + i] / float(clusterSize[cluster]);
        setChannel(means[cluster], i, mean, format);
      }
      setChannel(means[cluster], 3, 255.0f, format);
    }
  }

  love::image::Pixel zero {};
  memset(&zero, 0, data->getPixelSize());

  // replace pixels with the mean of their assigned segment
  for (auto y = 0; y < height; y++) {
    for (auto x = 0; x < width; x++) {
      auto cluster = whichCluster[y * width + x];
      if (cluster == k) {
        // expect cluster == k for transparent pixels
        data->setPixel(x, y, zero);
      } else {
        data->setPixel(x, y, means[cluster]);
      }
    }
  }

  delete[] means;
  delete[] whichCluster;
  delete[] clusterSum;
  delete[] clusterSize;
}


void ImageProcessing::testOnlyRedChannel(love::image::ImageData *data) {
  auto width = data->getWidth(), height = data->getHeight();
  love::image::Pixel blankPixel = {}, p = {};
  for (auto y = 0; y < height; y++) {
    for (auto x = 0; x < width; x++) {
      data->getPixel(x, y, p);
      switch (data->getFormat()) {
      case love::PixelFormat::PIXELFORMAT_RGBA8:
        blankPixel.rgba8[0] = p.rgba8[0];
        blankPixel.rgba8[3] = p.rgba8[3];
        break;
      case love::PixelFormat::PIXELFORMAT_RGBA16:
        blankPixel.rgba16[0] = p.rgba16[0];
        blankPixel.rgba16[3] = p.rgba16[3];
        break;
      case love::PixelFormat::PIXELFORMAT_RGBA16F:
        blankPixel.rgba16f[0] = p.rgba16f[0];
        blankPixel.rgba16f[3] = p.rgba16f[3];
        break;
      case love::PixelFormat::PIXELFORMAT_RGBA32F:
        blankPixel.rgba32f[0] = p.rgba32f[0];
        blankPixel.rgba32f[3] = p.rgba32f[3];
        break;
      default:
        break;
      }
      data->setPixel(x, y, blankPixel);
    }
  }
}

int ImageProcessing::paletteSwap(
    love::image::ImageData *data, const love::Colorf &fromColor, const love::Colorf &toColor) {
  auto width = data->getWidth(), height = data->getHeight();
  auto format = data->getFormat();

  love::image::Pixel fromPixel = {}, toPixel = {};
  setChannel(fromPixel, 0, fromColor.r * 255.0f, format);
  setChannel(fromPixel, 1, fromColor.g * 255.0f, format);
  setChannel(fromPixel, 2, fromColor.b * 255.0f, format);
  setChannel(fromPixel, 3, 255.0f, format);
  setChannel(toPixel, 0, toColor.r * 255.0f, format);
  setChannel(toPixel, 1, toColor.g * 255.0f, format);
  setChannel(toPixel, 2, toColor.b * 255.0f, format);
  setChannel(toPixel, 3, 255.0f, format);

  love::image::Pixel currentPixel {};
  int count = 0;

  for (auto y = 0; y < height; y++) {
    for (auto x = 0; x < width; x++) {
      data->getPixel(x, y, currentPixel);
      if (data->arePixelsEqual(currentPixel, fromPixel)) {
        data->setPixel(x, y, toPixel);
        count++;
      }
    }
  }
  return count;
}

void ImageProcessing::paletteSwap(love::image::ImageData *data, PaletteProvider &palette) {
  auto width = data->getWidth(), height = data->getHeight();
  auto format = data->getFormat();

  love::image::Pixel p {};
  float rgba[4];
  std::unordered_map<int, love::image::Pixel> swaps;

  for (auto y = 0; y < height; y++) {
    for (auto x = 0; x < width; x++) {
      data->getPixel(x, y, p);

      // if never seen before, map to next color in palette
      int hash = data->getPixelHash(p);
      DrawUtil::getRGBAFloat(p, format, rgba);
      auto found = swaps.find(hash);
      if (found == swaps.end()) {
        love::image::Pixel swap {};
        auto hexValue = palette.nextColor(p, format);
        setChannel(swap, 0, ((hexValue >> 16) & 0xFF), format);
        setChannel(swap, 1, ((hexValue >> 8) & 0xFF), format);
        setChannel(swap, 2, ((hexValue >> 0) & 0xFF), format);
        setChannel(swap, 3, 255.0f, format);
        swaps.emplace(hash, swap);
      }

      // replace with mapping
      data->setPixel(x, y, swaps[hash]);

      // maintain original alpha
      auto dest = (love::image::Pixel *)((uint8 *)data->getData()
          + ((y * width + x) * data->getPixelSize()));
      setChannel(*dest, 3, rgba[3], format);
    }
  }
}

float GAUSSIAN_KERNEL[3][3] = {
  { 0.0625f, 0.125f, 0.0625f },
  { 0.125f, 0.25f, 0.0125f },
  { 0.0625f, 0.125f, 0.0625f },
};

void copyRegionOverflowClamp(love::image::ImageData *src, int srcWidth, int srcHeight,
    love::image::Pixel *dst, int x, int y, int w, int h) {
  for (int srcY = y, dstY = 0; srcY < y + h; srcY++, dstY++) {
    for (int srcX = x, dstX = 0; srcX < x + w; srcX++, dstX++) {
      love::image::Pixel *dstPixel = dst + (dstY * w + dstX);
      int overflowX = std::max(0, std::min(srcWidth - 1, srcX));
      int overflowY = std::max(0, std::min(srcHeight - 1, srcY));
      src->getPixel(overflowX, overflowY, *dstPixel);
    }
  }
}

void convolve(love::image::Pixel *inBuf, float *kernel, int w, int h, love::PixelFormat format,
    love::image::Pixel &outPixel) {
  float rgba[4];
  float sums[3] = { 0.0f, 0.0f, 0.0f };
  float outAlpha = 255.0f;
  int cx = w / 2, cy = h / 2;

  for (auto y = 0; y < w; y++) {
    for (auto x = 0; x < h; x++) {
      love::image::Pixel *pixel = inBuf + (y * w + x);
      DrawUtil::getRGBAFloat(*pixel, format, rgba);
      for (int i = 0; i < 3; i++) {
        sums[i] += rgba[i] * kernel[y * w + x];
      }
      if (x == cx && y == cy) {
        outAlpha = rgba[3];
      }
    }
  }


  for (int i = 0; i < 3; i++) {
    setChannel(outPixel, i, sums[i], format);
  }
  setChannel(outPixel, 3, outAlpha, format);
}

void ImageProcessing::gaussianBlur(love::image::ImageData *data) {
  auto width = data->getWidth(), height = data->getHeight();
  auto format = data->getFormat();

  // don't blur in-place, or you introduce artifacts and periodicity
  auto outData = new love::image::ImageData(width, height, format);

  love::image::Pixel buf[9];
  love::image::Pixel outPixel {};
  for (auto y = 0; y < height; y++) {
    for (auto x = 0; x < width; x++) {
      copyRegionOverflowClamp(data, width, height, buf, x - 1, y - 1, 3, 3);
      convolve(buf, (float *)GAUSSIAN_KERNEL, 3, 3, format, outPixel);
      outData->setPixel(x, y, outPixel);
    }
  }

  data->paste(outData, 0, 0, 0, 0, width, height);
  outData->release();
}

int pixelRGBA8ToHex(love::image::Pixel &p) {
  return ((p.rgba8[0] & 0xff) << 16) + ((p.rgba8[1] & 0xff) << 8) + (p.rgba8[2] & 0xff);
}

void compareNeighbors(love::image::Pixel &p, love::image::ImageData *data, int nx, int ny,
    uint8 *numNeighborsEqual, std::unordered_map<int, int> &neighborColors) {
  love::image::Pixel neighborPixel {};
  if (!data->inside(nx, ny))
    return;
  data->getPixel(nx, ny, neighborPixel);
  if (data->arePixelsEqual(p, neighborPixel)) {
    (*numNeighborsEqual)++;
  }
  auto neighborHex = pixelRGBA8ToHex(neighborPixel);
  if (neighborColors.find(neighborHex) == neighborColors.end()) {
    neighborColors.emplace(neighborHex, 1);
  } else {
    neighborColors[neighborHex]++;
  }
}

int findMostCommonNeighbor(std::unordered_map<int, int> &neighborColors) {
  int mostCommonNeighborHex = 0;
  int highestNeighborCount = 0;
  for (auto &[neighborHex, neighborCount] : neighborColors) {
    if (neighborCount > highestNeighborCount) {
      mostCommonNeighborHex = neighborHex;
      highestNeighborCount = neighborCount;
    }
  }
  return mostCommonNeighborHex;
}

void ImageProcessing::removeIslands(love::image::ImageData *data, uint8 minEqualNeighbors) {
  if (minEqualNeighbors < 1) {
    // noop, all pixels have at least zero equal neighbors
    return;
  }
  auto width = data->getWidth(), height = data->getHeight();
  auto format = data->getFormat();

  auto numNeighborsEqual = new uint8[width * height];
  auto mostCommonNeighbor = new love::image::ImageData(width, height, format);

  love::image::Pixel currentPixel {};
  love::image::Pixel outPixel {};
  float outRgb[3];
  setChannel(outPixel, 3, 255.0f, format);
  std::unordered_map<int, int> neighborColors;
  for (auto y = 0; y < height; y++) {
    for (auto x = 0; x < width; x++) {
      neighborColors.clear();
      data->getPixel(x, y, currentPixel);

      // for each neighbor, get the pixel color; if same, increment same-neighbors;
      // populate map of neighbor color counts
      numNeighborsEqual[y * width + x] = 0;
      compareNeighbors(
          currentPixel, data, x + 1, y, numNeighborsEqual + (y * width + x), neighborColors);
      compareNeighbors(
          currentPixel, data, x - 1, y, numNeighborsEqual + (y * width + x), neighborColors);
      compareNeighbors(
          currentPixel, data, x, y + 1, numNeighborsEqual + (y * width + x), neighborColors);
      compareNeighbors(
          currentPixel, data, x, y - 1, numNeighborsEqual + (y * width + x), neighborColors);

      // find the most common neighbor pixel color
      if (numNeighborsEqual[y * width + x] < minEqualNeighbors) {
        int mostCommonNeighborHex = findMostCommonNeighbor(neighborColors);
        DrawUtil::hexToRGBFloat(mostCommonNeighborHex, outRgb);
        setChannel(outPixel, 0, outRgb[0], format);
        setChannel(outPixel, 1, outRgb[1], format);
        setChannel(outPixel, 2, outRgb[2], format);
        mostCommonNeighbor->setPixel(x, y, outPixel);
      }
    }
  }

  love::image::Pixel subPixel {};
  for (auto y = 0; y < height; y++) {
    for (auto x = 0; x < width; x++) {
      // if this pixel has numNeighborsEqual below threshold, replace with most common neighbor
      if (numNeighborsEqual[y * width + x] < minEqualNeighbors) {
        mostCommonNeighbor->getPixel(x, y, subPixel);
        data->setPixel(x, y, subPixel);
      }
    }
  }

  delete[] numNeighborsEqual;
  mostCommonNeighbor->release();
}

// stratify the r, g, and b channels as much as possible.
// do each channel independently (we don't care about preserving hue)
void ImageProcessing::normalizeRgb(love::image::ImageData *data) {
  auto width = data->getWidth(), height = data->getHeight();
  auto format = data->getFormat();

  float minRgb[3];
  float maxRgb[3];
  float currentRgba[4];
  for (auto c = 0; c < 3; c++) {
    minRgb[c] = std::numeric_limits<float>::max();
    maxRgb[c] = std::numeric_limits<float>::min();
  }

  love::image::Pixel p {};
  for (auto y = 0; y < height; y++) {
    for (auto x = 0; x < width; x++) {
      data->getPixel(x, y, p);
      DrawUtil::getRGBAFloat(p, format, currentRgba);
      for (auto c = 0; c < 3; c++) {
        if (currentRgba[c] < minRgb[c]) {
          minRgb[c] = currentRgba[c];
        }
        if (currentRgba[c] > maxRgb[c]) {
          maxRgb[c] = currentRgba[c];
        }
      }
    }
  }

  float diffRgb[3];
  for (auto c = 0; c < 3; c++) {
    diffRgb[c] = (maxRgb[c] - minRgb[c]);
    if (diffRgb[c] < 1.0f) {
      diffRgb[c] = 1.0f;
    }
  }

  for (auto y = 0; y < height; y++) {
    for (auto x = 0; x < width; x++) {
      data->getPixel(x, y, p);
      DrawUtil::getRGBAFloat(p, format, currentRgba);
      for (auto c = 0; c < 3; c++) {
        currentRgba[c] = ((currentRgba[c] - minRgb[c]) / diffRgb[c]) * 255.0f;
        setChannel(p, c, currentRgba[c], format);
      }
      data->setPixel(x, y, p);
    }
  }
}
