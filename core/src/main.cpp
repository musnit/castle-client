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

std::string androidGetDeckId() {
  JNIEnv *env = (JNIEnv *)SDL_AndroidGetJNIEnv();
  jclass activity = env->FindClass("ghost/CoreGameActivity");

  jmethodID methodHandle = env->GetStaticMethodID(activity, "getDeckId", "()Ljava/lang/String;");

  jstring resultJString = (jstring)env->CallStaticObjectMethod(activity, methodHandle);
  const char *utf = env->GetStringUTFChars(resultJString, 0);
  std::string result;
  if (utf) {
    result = std::string(utf);
    env->ReleaseStringUTFChars(resultJString, utf);
  }

  env->DeleteLocalRef(resultJString);
  env->DeleteLocalRef(activity);

  return result;
}

int SDL_main(int argc, char *argv[]) {
  Engine eng;
  std::string currentDeckId = "";

  loop([&]() {
    std::string newDeckId = androidGetDeckId();
    if (currentDeckId != newDeckId) {
      currentDeckId = newDeckId;
      eng.loadSceneFromDeckId(newDeckId.c_str());
    }

    return eng.frame();
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
    if (scenePath) {
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
    }
#endif

    return eng.frame();
  });
  return 0;
}
