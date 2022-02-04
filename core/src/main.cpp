#include "precomp.h"
#include "engine.h"


// Run the main loop, calling `frame` per frame. `frame` should return a boolean that is `false`
// when it wants to quit. Handles both the web and desktop cases.
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

#ifdef ANDROID
#include <jni.h>

static Engine &getEngine() {
  static Engine engine;
  return engine;
}

static const char *newInitialParams = NULL;
static const char *newCoreViews = NULL;
static double newBeltHeightFraction = 0.0;
static bool enginePaused = false;

extern "C" void Java_ghost_CoreGameActivity_castleCoreViewSetInitialParams(
    JNIEnv *env, jclass thiz, jstring initialParamsJString) {
  newInitialParams = env->GetStringUTFChars(initialParamsJString, 0);
}

extern "C" void Java_ghost_CoreGameActivity_castleCoreViewSetCoreViews(
    JNIEnv *env, jclass thiz, jstring coreViewsJString) {
  newCoreViews = env->GetStringUTFChars(coreViewsJString, 0);
}

extern "C" void Java_ghost_CoreGameActivity_castleCoreViewSetBeltHeightFraction(
    JNIEnv *env, jclass thiz, double beltHeightFraction) {
  newBeltHeightFraction = beltHeightFraction;
}

extern "C" void Java_ghost_CoreGameActivity_castleCoreViewSetPaused(
    JNIEnv *env, jclass thiz, bool paused) {
  enginePaused = paused;
}

int SDL_main(int argc, char *argv[]) {
  loop([&]() {
    if (newInitialParams) {
      getEngine().setInitialParams(newInitialParams);
      newInitialParams = NULL;
    }
    if (newCoreViews) {
      getEngine().setCoreViews(newCoreViews);
      newCoreViews = NULL;
    }
    getEngine().setBeltHeightFraction(newBeltHeightFraction);
    getEngine().setPaused(enginePaused);

    return getEngine().frame();
  });
  return 0;
}
#endif

// Main web and desktop entrypoint
#undef main // SDL does some weird stuff overriding `main` with a macro...
int main(int argc, char *argv[]) {
  Engine eng;

#ifndef __EMSCRIPTEN__
  // Load from file on desktop
  static const char *scenePath = nullptr;
  if (!eng.hasInitialDeck()) {
#ifdef LOVE_MACOSX
    constexpr auto defaultScenePath = "../../../test-watch.json";
#else
    constexpr auto defaultScenePath = "test-watch.json";
#endif
    scenePath = argc > 1 ? argv[1] : defaultScenePath;
    eng.loadSceneFromFile(scenePath);
  }
#endif

  loop([&]() {
#ifndef __EMSCRIPTEN__
  // Reload scene from file if it changed
  // TODO: last_write_time is not linking on android
  /*if (scenePath) {
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
        eng.loadSceneFromFile(scenePath);
      }
    }
  }*/
#endif
    return eng.frame();
  });
  return 0;
}
