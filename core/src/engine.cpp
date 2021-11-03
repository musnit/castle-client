#include "engine.h"

#include "js.h"
#include "api.h"
#include "expressions/expression.h"
#include "sound.h"


//
// JavaScript bindings
//

JS_DEFINE(int, JS_getCanvasWidth, (),
    { return document.querySelector("#canvas").getBoundingClientRect().width; });
JS_DEFINE(int, JS_getCanvasHeight, (),
    { return document.querySelector("#canvas").getBoundingClientRect().height; });
JS_DEFINE(double, JS_getDevicePixelRatio, (), { return window.devicePixelRatio; });
JS_DEFINE(int, JS_documentHasFocus, (), { return document.hasFocus() ? 1 : 0; });
JS_DEFINE(int, JS_hasInitialDeck, (), { return Castle.hasInitialDeck ? 1 : 0; });
JS_DEFINE(int, JS_isDebugEnabled, (),
    { return new URLSearchParams(window.location.search).get("debug") != null; });


//
// Utilities from Ghost (old term for Castle's extended version of Love)
//

extern "C" double ghostScreenScaling; // Globally scales rendering and touch coordinates
extern "C" bool ghostChildWindowCloseEventReceived; // Whether the OS tried to close the window

//
// Android bindings
//

#ifdef ANDROID
#include <jni.h>

double androidGetGhostScreenScaling() {
  JNIEnv *env = (JNIEnv *)SDL_AndroidGetJNIEnv();
  jclass activity = env->FindClass("ghost/CoreGameActivity");

  jmethodID getGhostScreenScaling
      = env->GetStaticMethodID(activity, "getGhostScreenScaling", "()D");
  double screenScaling = (jdouble)env->CallStaticDoubleMethod(activity, getGhostScreenScaling);

  env->DeleteLocalRef(activity);

  return screenScaling;
}

#endif


//
// Pre-init
//

Engine::PreInit::PreInit() {
  // Set debug based on flag in web, always enabled on other targets (for now)
#ifdef __EMSCRIPTEN__
  Debug::isEnabled = JS_isDebugEnabled();
#else
#ifndef NDEBUG
  Debug::isEnabled = true;
#endif
#endif

  // SDL parameters. In pre-init so we can still eg. refresh the page using keyboard if tests fail.
  SDL_SetHint(SDL_HINT_TOUCH_MOUSE_EVENTS, "0"); // Don't doublecount touches as mouse events
#ifdef __EMSCRIPTEN__
  SDL_EventState(SDL_TEXTINPUT, SDL_DISABLE); // Prevent keyboard input capture in web
  SDL_EventState(SDL_KEYDOWN, SDL_DISABLE);
  SDL_EventState(SDL_KEYUP, SDL_DISABLE);
#endif
}


//
// Constructor, destructor
//

Engine::Engine() {
  // First timer step
  lv.timer.step();

  // Set love identity (needed for filesystem calls to work)
  lv.filesystem.setIdentity("Castle", true);

  ExpressionRegistrar::registerExpressions();
}


//
// Deck / scene management
//

bool Engine::hasInitialDeck() const {
#ifdef __EMSCRIPTEN__
  return JS_hasInitialDeck();
#else
  return false;
#endif
}

struct SceneLoadedEvent {
  PROP(int, status) = 0;
};

void Engine::setInitialParams(const char *initialParamsJson) {
  const char *deckId = nullptr;
  const char *deckVariables = nullptr;
  const char *initialSnapshotJson = nullptr;
  const char *initialCardId = nullptr;
  const char *initialCardSceneDataUrl = nullptr;
  auto useNativeFeed = false;
  auto isNewScene = false;
  auto archive = Archive::fromJson(initialParamsJson);
  archive.read([&](Reader &reader) {
    isEditing = reader.boolean("isEditable", false);
    deckId = reader.str("deckId", nullptr);
    deckVariables = reader.str("deckVariables", nullptr);
    initialCardId = reader.str("initialCardId", nullptr);
    initialCardSceneDataUrl = reader.str("initialCardSceneDataUrl", nullptr);
    initialSnapshotJson = reader.str("initialSnapshotJson", nullptr);
    isNewScene = reader.boolean("isNewScene", false);
    Scene::uiPixelRatio = float(reader.num("pixelRatio", Scene::uiPixelRatio));
    useNativeFeed = reader.boolean("useNativeFeed", false);
  });
  if (isEditing) {
    editor = std::make_unique<Editor>(bridge);
  }
  if (isEditing && isNewScene) {
    editor->loadEmptyScene();

    // maybe still load snapshot variables
    if (initialSnapshotJson) {
      loadSceneFromJson(initialSnapshotJson, true);
    } else {
      pendingSceneLoadedEvent = true;
    }
  } else if (initialSnapshotJson) {
    // no network request, expect all needed data from json blob
    loadSceneFromJson(initialSnapshotJson, false);
  } else if (deckId) {
    loadSceneFromDeckId(deckId, deckVariables, initialCardId, initialCardSceneDataUrl);
  } else if (useNativeFeed) {
    feed = std::make_unique<Feed>(bridge);
    feed->fetchInitialDecks();
  }
  if (isEditing) {
    getLibraryClipboard().sendClipboardData(editor->getBridge(), editor->getScene());
  }
}

void Engine::setBeltHeightFraction(double beltHeightFraction) {
  Belt::heightFraction = float(beltHeightFraction);
}

void Engine::loadSceneFromFile(const char *path) {
  auto archive = Archive::fromFile(path);
  archive.read([&](Reader &reader) {
    reader.arr("variables", [&]() {
      if (isEditing) {
        editor->readVariables(reader);
      } else {
        player.readVariables(reader);
      }
    });
    reader.obj("initialCard", [&]() {
      reader.obj("sceneData", [&]() {
        reader.obj("snapshot", [&]() {
          if (isEditing) {
            editor->readScene(reader);
          } else {
            player.readScene(reader);
          }
          pendingSceneLoadedEvent = true;
        });
      });
    });
  });
}

void Engine::loadSceneFromJson(const char *json, bool skipScene) {
  auto archive = Archive::fromJson(json);
  archive.read([&](Reader &reader) {
    reader.arr("variables", [&]() {
      if (isEditing) {
        editor->readVariables(reader);
      } else {
        player.readVariables(reader);
      }
    });
    if (!skipScene) {
      reader.obj("sceneData", [&]() {
        reader.obj("snapshot", [&]() {
          if (isEditing) {
            editor->readScene(reader);
          } else {
            player.readScene(reader);
          }
        });
      });
    }
    pendingSceneLoadedEvent = true;
  });
}

void Engine::loadSceneFromDeckId(const char *deckId, const char *variables,
    const char *initialCardId, const char *initialCardSceneDataUrl) {
  API::loadDeck(
      deckId, variables, initialCardId, initialCardSceneDataUrl,
      !isEditing, // don't use cache when editing
      [=](APIResponse &response) {
        if (response.success) {
          auto reader = response.reader;
          if (isEditing) {
            editor->readVariables(reader);
          } else {
            player.readVariables(reader);
          }
        }
      },
      [=](APIResponse &response) {
        if (response.success) {
          auto reader = response.reader;
          if (isEditing) {
            editor->readScene(reader);
          } else {
            player.readScene(reader);
          }
          pendingSceneLoadedEvent = true;
        }
      });
}

void Engine::loadSceneFromCardId(const char *cardId) {
  API::loadCard(cardId,
      !isEditing, // don't use cache when editing
      [=](APIResponse &response) {
        if (response.success) {
          auto reader = response.reader;
          if (isEditing) {
            editor->readScene(reader);
          } else {
            player.readScene(reader);
          }
          pendingSceneLoadedEvent = true;
        }
      });
}

struct AndroidBackPressedEvent {};

void Engine::androidHandleBackPressed() {
#ifdef ANDROID
  if (isEditing) {
    if (editor->androidHandleBackPressed()) {
      return;
    }
  }

  AndroidBackPressedEvent event;
  getBridge().sendEvent("CASTLE_SYSTEM_BACK_BUTTON", event);
#endif
}

//
// Frame
//

bool Engine::frame() {
  // Based on the main loop from 'boot.lua' in the Love codebase

  // In web, if the window is unfocused reduce loop frequency and pause to keep CPU usage low.
#ifdef __EMSCRIPTEN__
  {
    auto focused = JS_documentHasFocus();
    if (focused != prevWindowFocused) {
      prevWindowFocused = focused;
      if (focused) {
        emscripten_set_main_loop_timing(EM_TIMING_RAF, 0);
        lv.timer.step(); // Step timer and skip frame so we don't have a huge `dt`
        return true;
      } else {
        emscripten_set_main_loop_timing(EM_TIMING_SETTIMEOUT, 100);
      }
    }
    if (!focused) {
      return true;
    }
  }
#endif

#ifdef __EMSCRIPTEN__
  // Update window size and screen scaling based on canvas in web. This will generate an
  // `SDL_WINDOWEVENT_RESIZED`, so we do it before the event pump to let Love process that
  // immediately.
  if (auto w = JS_getCanvasWidth(), h = JS_getCanvasHeight();
      w != prevWindowWidth || h != prevWindowHeight) {
    Debug::log("canvas resized to {}, {}", w, h);
    SDL_SetWindowSize(lv.window.getSDLWindow(), w, h);
    ghostScreenScaling = double(w) / 800;
    prevWindowWidth = w;
    prevWindowHeight = h;
  }
#elif __ANDROID__
  ghostScreenScaling = androidGetGhostScreenScaling();
#else
  // Just set screen scaling based on window size in desktop
  {
    int w = 0, h = 0;
    SDL_GetWindowSize(lv.window.getSDLWindow(), &w, &h);
    ghostScreenScaling = double(w) / 800;
  }
#endif

  // Process events. Quit if the window was closed.
  lv.event.pump();
  lv.event.clear();
  if (ghostChildWindowCloseEventReceived) {
    return false;
  }

  // Process bridge
  bridge.flushPendingReceives();

  // Process API callbacks
  API::runCallbacks();

  // Step timer and run update with the resulting `dt`
  update(lv.timer.step());

  // Draw
  lv.graphics.origin();
  lv.graphics.clear(love::Colorf(0, 0, 0, 1), {}, {});
  draw();
  lv.graphics.present(nullptr);

  return !shouldQuit;
}


//
// Update
//

struct DidNavigateToCardEvent {
  PROP(std::string, cardId);
};

void Engine::update(double dt) {
  if (!isEditing) {
    if (player.hasScene()) {
      if (auto nextCardId = player.getScene().getNextCardId(); nextCardId) {
        // load next card
        loadSceneFromCardId(nextCardId->c_str());

        // notify the UI that we moved
        // DID_NAVIGATE_TO_CARD distinguishes from editor's NAVIGATE_TO_CARD
        DidNavigateToCardEvent ev { *nextCardId };
        getBridge().sendEvent("DID_NAVIGATE_TO_CARD", ev);

        player.getScene().setNextCardId(std::nullopt);
      }
    }
  }

  if (isEditing) {
    editor->update(dt);
  } else {
    if (feed) {
      feed->update(dt);
    } else {
      player.update(dt);
    }
  }

#ifdef ANDROID
  static bool isBackDown = false;
  if (lv.keyboard.isDown({ love::keyboard::Keyboard::Key::KEY_APP_BACK })) {
    isBackDown = true;
  } else {
    if (isBackDown) {
      isBackDown = false;
      androidHandleBackPressed();
    }
  }
#endif

#ifdef CASTLE_ENABLE_TESTS
  tests.update(dt);
#endif
}


//
// Draw
//

void Engine::draw() {
  if (isEditing) {
    editor->draw();
  } else {
    if (feed) {
      feed->draw();
    } else {
      player.draw();
    }
  }

#ifdef CASTLE_ENABLE_TESTS
  tests.draw();
#endif

  // Debug messages
  if (Debug::isEnabled) {
    lv.graphics.setColor(love::Colorf(1, 0, 0, 1));
    lv.graphics.print({ { Debug::getAndClearDisplay(), { 1, 1, 1, 1 } } }, debugFont.get(),
        love::Matrix4(20, 20, 0, 1, 1, 0, 0, 0, 0));
  }

  if (pendingSceneLoadedEvent) {
    pendingSceneLoadedEvent = false;
    SceneLoadedEvent event;
    getBridge().sendEvent("SCENE_LOADED", event);
  }
}


//
// Bridge events
//

struct ClearSceneReceiver {
  inline static const BridgeRegistration<ClearSceneReceiver> registration { "CLEAR_SCENE" };

  struct Params {
    PROP(int, code) = 0;
  } params;

  void receive(Engine &engine) {
    Debug::log("core: received CLEAR_SCENE");
    if (engine.getIsEditing()) {
      // TODO: maybe destroy editor, recreate on next editing mount
      engine.maybeGetEditor()->clearState();
    }

    Sound::clearCache();
  }
};

struct PreloadDeckReceiver {
  inline static const BridgeRegistration<PreloadDeckReceiver> registration { "PRELOAD_DECK" };

  struct Params {
    PROP(std::string, deckId);
    PROP(std::string, deckVariables);
    PROP(std::string, initialCardId);
    PROP(std::string, initialCardSceneDataUrl);
  } params;

  void receive(Engine &engine) {
    API::preloadDeck(params.deckId(), params.deckVariables(), params.initialCardId(),
        params.initialCardSceneDataUrl());
  }
};
