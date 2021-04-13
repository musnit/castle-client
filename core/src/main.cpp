#include "precomp.h"
#include "engine.h"
#include "snapshot.h"
#include <filesystem>

// #define WATCH_SCENE_FILE

// Run the main loop, calling `frame` per frame. `frame` should return a
// boolean that is `false` when it wants to quit. Handles both the web and
// desktop cases.
template<typename F>
void loop(F &&frame) {
#ifdef __EMSCRIPTEN__
  static auto &sFrame = frame;
  emscripten_set_main_loop(
      []() {
        sFrame();
      },
      0, true);
#else
  while (frame()) {
  }
#endif
}

// Main web and desktop entrypoint
#undef main // SDL does some weird stuff overriding `main` with a macro...

#ifndef WATCH_SCENE_FILE

int main() {
  Engine eng;
  loop([&]() {
    return eng.frame();
  });
  return 0;
}

#else

auto getLastWriteTime() {
  auto ftime = std::filesystem::last_write_time("../../../assets/test-watch.json");
  return ftime.time_since_epoch().count();
}

int main() {
  auto writeTime = getLastWriteTime();
  int frame = 0;

  Engine eng("../../../assets/test-watch.json");
  loop([&]() {
    frame++;

    // only check file every 10 frames
    if (frame >= 10) {
      frame = 0;

      auto newWriteTime = getLastWriteTime();
      if (newWriteTime != writeTime) {
        writeTime = newWriteTime;

        eng.reloadFromFile();
      }
    }

    return eng.frame();
  });
  return 0;
}

#endif
