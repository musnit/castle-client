#pragma once

#include "precomp.h"

#include "lv.h"
#include "variables.h"
#include "tests.h"
#include "archive.h"
#include "bridge.h"
#include "player.h"
#include "editor/editor.h"
#include "editor/library_clipboard.h"
#include "feed/feed.h"
#include "core_views/core_views.h"

class Engine {
  // The top-level instance of Castle core. There should just be one of these for the entire
  // program. Multiplicity of scenes is managed by having multiple `Scene` instances.
  //
  // This class initializes the various modules involved in Castle core and contains the top-level
  // logic run on each frame of the main loop.

public:
  Engine(const Engine &) = delete; // Prevent accidental copies
  const Engine &operator=(const Engine &) = delete;

  explicit Engine();
  ~Engine();

  static Engine &getEngine();

  // expect to set once per engine use, e.g. on mount
  void setInitialParams(const char *initialParamsJson);

  void setCoreViews(const char *coreViewsJson);

  // may get sent multiple times per session from JS as UI layout changes
  void setBeltHeightFraction(double beltHeightFraction);


  // Main loop

  bool frame();
  void setPaused(bool paused);


  // Scene data

  bool hasInitialDeck() const;
  void loadSceneFromFile(const char *path);
  void loadSceneFromDeckId(
      const char *deckId, const char *initialCardId, const char *initialCardSceneDataUrl);
  void loadSceneFromCardId(const char *cardId, std::optional<std::string> deckId);
  void loadSceneFromJson(const char *json, bool skipScene);


  // Bridge access

  Bridge &getBridge();

  bool getIsEditing();
  Screen *maybeGetScreen();
  Editor *maybeGetEditor();
  void clearScreen();
  void suspendScreen();
  void resumeScreen();
  LibraryClipboard &getLibraryClipboard();

private:
  inline static Engine *instance = nullptr;
  Bridge bridge { *this };
  CoreViews coreViews { bridge };
  Lv lv { 800 / 2, 1120 / 2 };

  [[maybe_unused]] bool prevWindowFocused = true;
  [[maybe_unused]] int prevWindowWidth = 0, prevWindowHeight = 0;
  bool shouldQuit = false;
  bool pendingSceneLoadedEvent = false;
  bool paused = false;

  struct PreInit {
    // Allows us to run some early initialization steps before the rest of the
    // members are initialized.
    PreInit();
  } preInit;

#ifdef CASTLE_ENABLE_TESTS
  Tests tests;
#endif

  std::unique_ptr<love::Font> debugFont { lv.graphics.newDefaultFont(
      22, love::TrueTypeRasterizer::HINTING_NORMAL) };

  std::map<std::string, std::unique_ptr<Screen>> screens;
  std::string activeScreenId;
  bool isEditing = false;
  LibraryClipboard libraryClipboard; // persistent for engine instance lifetime

  void update(double dt);

  void draw();

  void androidHandleBackPressed();

  class FlushPendingReceivesThread : public love::thread::Threadable {
  public:
    FlushPendingReceivesThread(Engine &owner_)
        : owner(owner_) {
      threadName = "FlushPendingReceivesThread";
    };
    void threadFunction();

  protected:
    Engine &owner;
  };
  friend class FlushPendingReceivesThread;

  FlushPendingReceivesThread *flushPendingReceivesThread;
  std::mutex flushPendingReceivesMutex;
  std::vector<std::function<bool()>> androidBackButtonHandlers;
  bool shuttingDown = false;
};


// Inlined implementations

inline Engine &Engine::getEngine() {
  return *instance;
}

inline Bridge &Engine::getBridge() {
  return bridge;
}

inline Screen *Engine::maybeGetScreen() {
  if (screens.find(activeScreenId) == screens.end()) {
    return nullptr;
  }

  return screens[activeScreenId].get();
}

inline Editor *Engine::maybeGetEditor() {
  auto screen = maybeGetScreen();
  if (screen && screen->screenType() == EDITOR) {
    return (Editor *)screen;
  }

  return nullptr;
}

inline void Engine::clearScreen() {
  if (screens.find(activeScreenId) != screens.end()) {
    if (activeScreenId != "featuredFeed") {
      screens.erase(activeScreenId);
      activeScreenId = "";
    }
  }
}

inline void Engine::suspendScreen() {
  if (screens.find(activeScreenId) != screens.end()) {
    screens[activeScreenId]->suspend();
  }
}

inline void Engine::resumeScreen() {
  if (screens.find(activeScreenId) != screens.end()) {
    screens[activeScreenId]->resume();
  }
}

inline bool Engine::getIsEditing() {
  return isEditing;
}

inline LibraryClipboard &Engine::getLibraryClipboard() {
  return libraryClipboard;
}

inline void Engine::setPaused(bool paused_) {
  if (paused == paused_) {
    return;
  }

  paused = paused_;

  auto screen = maybeGetScreen();
  if (screen) {
    if (paused) {
      screen->suspend();
    } else {
      screen->resume();
    }
  }
}
