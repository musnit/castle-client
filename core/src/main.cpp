#include "precomp.h"
#include "engine.h"
#include "platform.h"


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
int main(int argc, char *argv[]) {
  Engine eng;

  auto scenePath = Platform::getAssetPath(argc > 1 ? argv[1] : "test-rules-1.json");
  if (!eng.hasInitialDeck()) {
    eng.loadSceneFromFile(scenePath.c_str());
  }

  loop([&]() {
#ifndef __EMSCRIPTEN__
    // Reload scene from file if it changed
    {
      static const auto getLastWriteTime = [&]() {
        auto ftime = std::filesystem::last_write_time(scenePath);
        return ftime.time_since_epoch().count();
      };
      static auto writeTime = getLastWriteTime();
      static auto frame = 0;
      frame++;
      if (frame >= 10) {
        frame = 0;
        auto newWriteTime = getLastWriteTime();
        if (newWriteTime != writeTime) {
          writeTime = newWriteTime;
          eng.loadSceneFromFile(scenePath.c_str());
        }
      }
    }
#endif

    return eng.frame();
  });
  return 0;
}
