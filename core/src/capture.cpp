#include "capture.h"

Capture::Capture(int width, int fps, int totalFrames_) {
  intervalBetweenCapture = 1.0 / double(fps);
  totalFrames = totalFrames_;
  screenshot = std::make_unique<Screenshot>(width);
}

Capture::~Capture() {
  clear();
}

void Capture::start() {
  if (!running) {
    clear();
    intervalSinceCapture = 0;
    running = true;
  }
}

void Capture::clear() {
  for (auto imageData : buffer) {
    delete imageData;
  }
  buffer.clear();
}

void Capture::update(Scene *scene, Bridge &bridge, double dt) {
  if (running) {
    intervalSinceCapture += dt;
    if (intervalSinceCapture >= intervalBetweenCapture) {
      Debug::log("capture: capturing frame");
      intervalSinceCapture = 0;
      buffer.emplace_back(screenshot->getScreenshotImageData(scene));
      if (int(buffer.size()) >= totalFrames) {
        stopAndSendEvent(bridge);
      }
    }
  }
}

struct CapturePendingEvent {
  PROP(bool, pending) = true;
};

struct CaptureFinishedEvent {
  PROP(std::string, path);
  PROP(int, numFrames);
};

void Capture::stopAndSendEvent(Bridge &bridge) {
  if (running) {
    running = false;
    Debug::log("stop capturing with size {}", buffer.size());

    CapturePendingEvent pending;
    bridge.sendEvent("CAPTURE_PENDING", pending);

    std::string baseFilename = "capture-";
    auto index = 0;
    for (auto imageData : buffer) {
      index++;
      std::string filename = baseFilename + std::to_string(index) + ".png";
      imageData->encode(
          love::image::FormatHandler::EncodedFormat::ENCODED_PNG, filename.c_str(), true);
    }

    CaptureFinishedEvent ev;
    ev.path = std::string(lv.filesystem.getSaveDirectory()) + "/" + baseFilename;
    ev.numFrames = totalFrames;
    bridge.sendEvent("CAPTURE_FINISHED", ev);
  }
}
