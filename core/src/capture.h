#pragma once

#include "precomp.h"
#include "bridge.h"
#include "scene.h"
#include "screenshot.h"

class Capture {
public:
  Capture(const Capture &) = delete;
  const Capture &operator=(const Capture &) = delete;
  explicit Capture(int width, int fps, int totalFrames);
  ~Capture();

  void start();
  void clear();
  void stopAndSendEvent(Bridge &bridge);
  bool isCapturing();
  void update(Scene *scene, Bridge &bridge, double dt);

private:
  Lv &lv { Lv::getInstance() };

  bool running = false;
  double intervalSinceCapture = 0;
  double intervalBetweenCapture = 0;
  int totalFrames = 0;

  std::unique_ptr<Screenshot> screenshot;
  std::vector<love::image::ImageData *> buffer;
};

inline bool Capture::isCapturing() {
  return running;
}
