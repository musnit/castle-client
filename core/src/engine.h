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

  // expect to set once per engine use, e.g. on mount
  void setInitialParams(const char *initialParamsJson);

  // may get sent multiple times per session from JS as UI layout changes
  void setBeltHeightFraction(double beltHeightFraction);


  // Main loop

  bool frame();


  // Scene data

  bool hasInitialDeck() const;
  void loadSceneFromFile(const char *path);
  void loadSceneFromDeckId(const char *deckId);
  void loadSceneFromCardId(const char *cardId);
  void loadSceneFromJson(const char *json, bool skipScene);


  // Bridge access

  Bridge &getBridge();

  Scene &getScene();
  Editor *maybeGetEditor();
  bool getIsEditing();
  LibraryClipboard &getLibraryClipboard();

private:
  Bridge bridge { *this };
  Lv lv { 800 / 2, 1120 / 2 };

  [[maybe_unused]] bool prevWindowFocused = true;
  [[maybe_unused]] int prevWindowWidth = 0, prevWindowHeight = 0;
  bool shouldQuit = false;
  bool pendingSceneLoadedEvent = false;

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

  Player player { bridge };
  std::unique_ptr<Editor> editor;
  bool isEditing = false;
  LibraryClipboard libraryClipboard; // persistent for engine instance lifetime

  void update(double dt);

  void draw();

  void androidHandleBackPressed();
  std::vector<std::function<bool()>> androidBackButtonHandlers;
};


// Inlined implementations

inline Bridge &Engine::getBridge() {
  return bridge;
}

inline Scene &Engine::getScene() {
  return player.getScene();
}

inline Editor *Engine::maybeGetEditor() {
  return editor.get();
}

inline bool Engine::getIsEditing() {
  return isEditing;
}

inline LibraryClipboard &Engine::getLibraryClipboard() {
  return libraryClipboard;
}
