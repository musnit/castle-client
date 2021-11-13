#include "image_processing.h"

love::image::ImageData *ImageProcessing::fitToMaxSize(love::image::ImageData *data, int maxSize) {
  auto img = love::DrawDataFrame::imageDataToImage(data);
  auto width = img->getWidth(), height = img->getHeight();
  auto scale = std::min(1.0f, std::min(float(maxSize) / width, float(maxSize) / height));
  auto resizeCanvas = love::DrawDataFrame::newCanvas(width * scale, height * scale);
  love::DrawDataFrame::renderToCanvas(resizeCanvas, [img, scale]() {
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

bool getRGBAFloat(love::image::Pixel &p, love::PixelFormat format, float *out) {
  switch (format) {
  case love::PixelFormat::PIXELFORMAT_RGBA8:
    out[0] = float(p.rgba8[0]);
    out[1] = float(p.rgba8[1]);
    out[2] = float(p.rgba8[2]);
    out[3] = float(p.rgba8[3]);
    return true;
  case love::PixelFormat::PIXELFORMAT_RGBA16:
    out[0] = float(p.rgba16[0]);
    out[1] = float(p.rgba16[1]);
    out[2] = float(p.rgba16[2]);
    out[3] = float(p.rgba16[3]);
    return true;
  case love::PixelFormat::PIXELFORMAT_RGBA16F:
    out[0] = float(p.rgba16f[0]);
    out[1] = float(p.rgba16f[1]);
    out[2] = float(p.rgba16f[2]);
    out[3] = float(p.rgba16f[3]);
    return true;
  case love::PixelFormat::PIXELFORMAT_RGBA32F:
    out[0] = float(p.rgba32f[0]);
    out[1] = float(p.rgba32f[1]);
    out[2] = float(p.rgba32f[2]);
    out[3] = float(p.rgba32f[3]);
    return true;
  default:
    return false;
  }
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

float distanceSquared(love::image::Pixel &p1, love::image::Pixel &p2, love::PixelFormat format) {
  float rgba1[4];
  getRGBAFloat(p1, format, rgba1);
  float rgba2[4];
  getRGBAFloat(p2, format, rgba2);
  float sum = 0.0f;
  for (auto ii = 0; ii < 3; ii++) { // ignore alpha
    sum += std::powf(rgba1[ii] - rgba2[ii], 2.0f);
  }
  return sum;
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
    for (auto y = 0; y < height; y++) {
      for (auto x = 0; x < width; x++) {
        love::image::Pixel p;
        data->getPixel(x, y, p);
        float minDist = std::numeric_limits<float>::max();
        uint8 closestCluster = k;
        for (uint8 cluster = 0; cluster < k; cluster++) {
          auto dist = distanceSquared(p, means[cluster], format);
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

    // for each cluster, recompute mean from member pixels
    for (auto cluster = 0; cluster < k; cluster++) {
      for (int i = 0; i < 3; i++) {
        float mean = clusterSum[cluster * 3 + i] / float(clusterSize[cluster]);
        setChannel(means[cluster], i, mean, format);
      }
      // TODO: preserve original image alpha
      setChannel(means[cluster], 3, 255.0f, format);
    }
  }

  // replace pixels with the mean of their assigned segment
  for (auto y = 0; y < height; y++) {
    for (auto x = 0; x < width; x++) {
      data->setPixel(x, y, means[whichCluster[y * width + x]]);
    }
  }

  delete[] means;
  delete[] whichCluster;
  delete[] clusterSum;
  delete[] clusterSize;
}


void ImageProcessing::testOnlyRedChannel(love::image::ImageData *data) {
  auto width = data->getWidth(), height = data->getHeight();
  love::image::Pixel blankPixel, p;
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

std::array<int, 60> PALETTE = {
  0x3b1725,
  0x73172d,
  0xb4202a,
  0xdf3e23,
  0xfa6a0a,
  0xf9a31b,
  0xffd541,
  0xfffc40,
  0xd6f264,
  0x9cdb43,
  0x59c135,
  0x14a02e,
  0x1a7a3e,
  0x24523b,
  0x122020,
  0x143464,
  0x285cc4,
  0x249fde,
  0x20d6c7,
  0xa6fcdb,
  0xfef3c0,
  0xfad6b8,
  0xf5a097,
  0xe86a73,
  0xbc4a9b,
  0x793a80,
  0x403353,
  0x242234,
  0x322b28,
  0x71413b,
  0xbb7547,
  0xdba463,
  0xf4d29c,
  0xdae0ea,
  0xb3b9d1,
  0x8b93af,
  0x6d758d,
  0x4a5462,
  0x333941,
  0x422433,
  0x5b3138,
  0x8e5252,
  0xba756a,
  0xe9b5a3,
  0xe3e6ff,
  0xb9bffb,
  0x849be4,
  0x588dbe,
  0x477d85,
  0x23674e,
  0x328464,
  0x5daf8d,
  0x92dcba,
  0xcdf7e2,
  0xe4d2aa,
  0xc7b08b,
  0xa08662,
  0x796755,
  0x5a4e44,
  0x423934,
};

void ImageProcessing::randomPaletteSwap(love::image::ImageData *data) {
  auto width = data->getWidth(), height = data->getHeight();
  auto format = data->getFormat();

  love::image::Pixel p;
  int nextPaletteIndex = 0;
  std::unordered_map<int, love::image::Pixel> swaps;

  // shuffle palette
  unsigned seed = std::chrono::system_clock::now().time_since_epoch().count();
  std::shuffle(PALETTE.begin(), PALETTE.end(), std::default_random_engine(seed));

  for (auto y = 0; y < height; y++) {
    for (auto x = 0; x < width; x++) {
      data->getPixel(x, y, p);

      // if never seen before, map to next color in palette
      int hash = data->getPixelHash(p);
      auto found = swaps.find(hash);
      if (found == swaps.end()) {
        love::image::Pixel swap;
        auto hexValue = PALETTE[nextPaletteIndex];
        setChannel(swap, 0, ((hexValue >> 16) & 0xFF), format);
        setChannel(swap, 1, ((hexValue >> 8) & 0xFF), format);
        setChannel(swap, 2, ((hexValue >> 0) & 0xFF), format);
        setChannel(swap, 3, 255.0f, format);
        swaps.emplace(hash, swap);

        nextPaletteIndex++;
        nextPaletteIndex = nextPaletteIndex % 9;
      }

      // replace with mapping
      data->setPixel(x, y, swaps[hash]);
    }
  }
}
