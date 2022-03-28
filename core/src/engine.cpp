#include "engine.h"

#include "js.h"
#include "api.h"
#include "expressions/expression.h"
#include "sound/sound.h"
#include "behaviors/text.h"
#include <common/delay.h>

#ifdef ANDROID
#include <jni.h>
namespace CastleAPI {
void initJNI();
jclass getGameActivityClass();
}
#endif

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
  jclass activity = CastleAPI::getGameActivityClass();

  jmethodID getGhostScreenScaling
      = env->GetStaticMethodID(activity, "getGhostScreenScaling", "()D");
  double screenScaling = (jdouble)env->CallStaticDoubleMethod(activity, getGhostScreenScaling);

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
#ifdef ANDROID
  CastleAPI::initJNI();
#endif

#ifdef __EMSCRIPTEN__
  auto screen = std::make_unique<Player>(bridge);
  screen->resume();
  activeScreenId = "player:web";
  screens.insert(std::make_pair(activeScreenId, std::move(screen)));
#endif

  instance = this;

  // First timer step
  lv.timer.step();

  // Set love identity (needed for filesystem calls to work)
  lv.filesystem.setIdentity("Castle", true);

  ExpressionRegistrar::registerExpressions();

  TextBehavior::loadFontResources(lv);
}

Engine::~Engine() {
  TextBehavior::unloadFontResources();
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
  const char *initialSnapshotJson = nullptr;
  const char *initialCardId = nullptr;
  const char *initialCardSceneDataUrl = nullptr;
  const char *jsScreenId = nullptr;
  const char *paginateFeedId = nullptr;
  const char *deepLinkDeckId = nullptr;
  int initialDeckIndex = 0;
  auto useNativeFeed = false;
  auto isNewScene = false;
  auto isNuxCompleted = true;
  auto isNativeFeedNuxCompleted = true;
  auto archive = Archive::fromJson(initialParamsJson);
  std::vector<std::string> nativeFeedDeckIds;
  archive.read([&](Reader &reader) {
    isEditing = reader.boolean("isEditable", false);
    deckId = reader.str("deckId", nullptr);
    initialCardId = reader.str("initialCardId", nullptr);
    initialCardSceneDataUrl = reader.str("initialCardSceneDataUrl", nullptr);
    initialSnapshotJson = reader.str("initialSnapshotJson", nullptr);
    jsScreenId = reader.str("screenId", nullptr);
    isNewScene = reader.boolean("isNewScene", false);
    Scene::uiPixelRatio = float(reader.num("pixelRatio", Scene::uiPixelRatio));
    reader.obj("textOverlayStyle", [&]() {
      reader.read(TextBehavior::overlayStyle);
    });
    useNativeFeed = reader.boolean("useNativeFeed", false);
    isNuxCompleted = reader.boolean("isNuxCompleted", true);
    isNativeFeedNuxCompleted = reader.boolean("isNativeFeedNuxCompleted", true);
    initialDeckIndex = reader.num("initialDeckIndex", 0);
    paginateFeedId = reader.str("paginateFeedId", nullptr);
    deepLinkDeckId = reader.str("deepLinkDeckId", nullptr);
    if (reader.has("nativeFeedDeckIds")) {
      reader.arr("nativeFeedDeckIds", [&]() {
        reader.each([&]() {
          auto deckId = reader.str();
          if (deckId) {
            nativeFeedDeckIds.push_back(*deckId);
          }
        });
      });
    }
  });

  std::unique_ptr<Screen> newScreen;
  std::string screenId;
  Editor *editor = nullptr;
  Feed *feed = nullptr;
  std::string screenIdPrefix = "";

  if (isEditing) {
    screenIdPrefix = "editor:";
  } else if (useNativeFeed) {
    screenIdPrefix = "feed:";
  } else {
    screenIdPrefix = "player:";
  }

  if (jsScreenId) {
    screenId = std::string(jsScreenId);
  } else if (deckId) {
    screenId = screenIdPrefix + std::string(deckId);
  } else {
    screenId = screenIdPrefix;
  }

  if (activeScreenId == "featuredFeed" && screenId != "featuredFeed") {
    screens["featuredFeed"]->suspend();
  }

  activeScreenId = screenId;

  bool foundExistingScreen = screens.find(screenId) != screens.end();

  // Editor needs to read scene again once it's mounted for loading backups
  if (!isEditing && foundExistingScreen) {
    if (deepLinkDeckId && screenId == "featuredFeed") {
      ((Feed *)screens[screenId].get())->setDeepLinkDeckId(deepLinkDeckId);
    }

    screens[screenId]->resume();
    return;
  }

  if (foundExistingScreen) {
    if (isEditing) {
      editor = (Editor *)screens[screenId].get();
    }
  } else {
    if (isEditing) {
      newScreen = std::make_unique<Editor>(bridge);
      editor = (Editor *)newScreen.get();
      screenIdPrefix = "editor:";
    } else if (useNativeFeed) {
      newScreen = std::make_unique<Feed>(bridge);
      feed = (Feed *)newScreen.get();
      screenIdPrefix = "feed:";
    } else {
      newScreen = std::make_unique<Player>(bridge);
      ((Player *)newScreen.get())->resume();
      screenIdPrefix = "player:";
    }

    screens.insert(std::make_pair(screenId, std::move(newScreen)));
  }

  if (feed) {
    feed->fetchInitialDecks(nativeFeedDeckIds, initialDeckIndex,
        paginateFeedId ? (std::optional<std::string>)std::string(paginateFeedId) : std::nullopt,
        isNuxCompleted, isNativeFeedNuxCompleted);

    if (deepLinkDeckId) {
      feed->setDeepLinkDeckId(deepLinkDeckId);
    }
  } else if (isEditing && isNewScene) {
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
    loadSceneFromDeckId(deckId, initialCardId, initialCardSceneDataUrl);
  }
  if (isEditing) {
    getLibraryClipboard().sendClipboardData(editor->getBridge(), editor->getScene());
  }
}

void Engine::setCoreViews(const char *coreViewsJson) {
  coreViews.setJson(coreViewsJson);
}

void Engine::setBeltHeightFraction(double beltHeightFraction) {
  Belt::heightFraction = float(beltHeightFraction);
}

void Engine::loadSceneFromFile(const char *path) {
  auto archive = Archive::fromFile(path);
  archive.read([&](Reader &reader) {
    reader.arr("variables", [&]() {
      auto screen = maybeGetScreen();
      if (screen) {
        screen->readVariables(reader);
      }
    });
    reader.obj("initialCard", [&]() {
      reader.obj("sceneData", [&]() {
        reader.obj("snapshot", [&]() {
          auto screen = maybeGetScreen();
          if (screen) {
            screen->readScene(reader, std::nullopt);
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
      auto screen = maybeGetScreen();
      if (screen) {
        screen->readVariables(reader);
      }
    });
    if (!skipScene) {
      reader.obj("sceneData", [&]() {
        reader.obj("snapshot", [&]() {
          auto screen = maybeGetScreen();
          if (screen) {
            screen->readScene(reader, std::nullopt);
          }
        });
      });
    }
    pendingSceneLoadedEvent = true;
  });
}

void Engine::loadSceneFromDeckId(
    const char *deckId, const char *initialCardId, const char *initialCardSceneDataUrl) {
  std::string deckIdStr = deckId;
  API::loadDeck(
      deckId, initialCardId, initialCardSceneDataUrl,
      !isEditing, // don't use cache when editing
      [=](APIResponse &response) {
        if (response.success) {
          auto reader = response.reader;
          auto screen = maybeGetScreen();
          if (screen) {
            screen->readVariables(reader);
          }
        }
      },
      [=](APIResponse &response) {
        if (response.success) {
          auto reader = response.reader;
          auto screen = maybeGetScreen();
          if (screen) {
            screen->readScene(reader, deckIdStr);
          }
          pendingSceneLoadedEvent = true;
        }
      });
}

void Engine::loadSceneFromCardId(const char *cardId, std::optional<std::string> deckId) {
  API::loadCard(cardId,
      !isEditing, // don't use cache when editing
      [=](APIResponse &response) {
        if (response.success) {
          auto reader = response.reader;
          auto screen = maybeGetScreen();
          if (screen) {
            screen->readScene(reader, deckId);
          }
          pendingSceneLoadedEvent = true;
        }
      });
}

struct AndroidBackPressedEvent {};

void Engine::androidHandleBackPressed() {
#ifdef ANDROID
  if (isEditing) {
    auto screen = maybeGetScreen();
    if (screen && screen->androidHandleBackPressed()) {
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
#ifdef ANDROID
  setPausedMutex.lock();
#endif

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
#elif defined(ANDROID)
  {
    int w = 0, h = 0;
    SDL_GetWindowSize(lv.window.getSDLWindow(), &w, &h);
    ghostScreenScaling = androidGetGhostScreenScaling();

    auto screen = maybeGetScreen();
    if (screen) {
      screen->setWindowSize(800, h / (double(w) / 800));
    }
  }
#else
  // Just set screen scaling based on window size in desktop
  {
    int w = 0, h = 0;
    SDL_GetWindowSize(lv.window.getSDLWindow(), &w, &h);
    ghostScreenScaling = double(w) / 800;

    auto screen = maybeGetScreen();
    if (screen) {
      screen->setWindowSize(800, h / ghostScreenScaling);
    }
  }
#endif

  // Process events. Quit if the window was closed.
  lv.event.pump();

#ifdef ANDROID
  setPausedMutex.unlock();
#endif
  lv.event.clear();
  if (ghostChildWindowCloseEventReceived) {
#ifdef ANDROID
    setPausedMutex.unlock();
#endif

    return false;
  }

#ifdef ANDROID
  setPausedMutex.lock();
#endif

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

#ifdef ANDROID
  setPausedMutex.unlock();
#endif

  return !shouldQuit;
}


//
// Update
//

struct DidNavigateToCardEvent {
  PROP(std::string, cardId);
};

void Engine::update(double dt) {
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

  if (paused) {
    return;
  }

  if (!isEditing) {
    auto screen = maybeGetScreen();
    if (screen && screen->screenType() == PLAYER && screen->hasScene()) {
      if (auto nextCardId = screen->getScene().getNextCardId(); nextCardId) {
        // load next card
        loadSceneFromCardId(nextCardId->c_str(), screen->getScene().getDeckId());

        // notify the UI that we moved
        // DID_NAVIGATE_TO_CARD distinguishes from editor's NAVIGATE_TO_CARD
        DidNavigateToCardEvent ev { *nextCardId };
        getBridge().sendEvent("DID_NAVIGATE_TO_CARD", ev);

        screen->getScene().setNextCardId(std::nullopt);
      }
    }
  }

  auto screen = maybeGetScreen();
  if (screen) {
    screen->update(dt);
  }

#ifdef CASTLE_ENABLE_TESTS
  tests.update(dt);
#endif
}


//
// Draw
//

void Engine::draw() {
  auto screen = maybeGetScreen();
  if (screen) {
    screen->draw();
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

struct SuspendSceneReceiver {
  inline static const BridgeRegistration<SuspendSceneReceiver> registration { "SUSPEND_SCENE" };

  struct Params {
    PROP(int, code) = 0;
  } params;

  void receive(Engine &engine) {
    Debug::log("core: received SUSPEND_SCENE");
    engine.suspendScreen();
  }
};

struct ResumeSceneReceiver {
  inline static const BridgeRegistration<ResumeSceneReceiver> registration { "RESUME_SCENE" };

  struct Params {
    PROP(int, code) = 0;
  } params;

  void receive(Engine &engine) {
    Debug::log("core: received RESUME_SCENE");
    engine.resumeScreen();
  }
};

struct ClearSceneReceiver {
  inline static const BridgeRegistration<ClearSceneReceiver> registration { "CLEAR_SCENE" };

  struct Params {
    PROP(int, code) = 0;
  } params;

  void receive(Engine &engine) {
    Debug::log("core: received CLEAR_SCENE");
    engine.clearScreen();
  }
};

struct PreloadDeckReceiver {
  inline static const BridgeRegistration<PreloadDeckReceiver> registration { "PRELOAD_DECK" };

  struct Params {
    PROP(std::string, deckId);
    PROP(std::string, initialCardId);
    PROP(std::string, initialCardSceneDataUrl);
  } params;

  void receive(Engine &engine) {
    // TODO: this doesn't make sense now that we reload variables each time a deck is opened
    // API::preloadDeck(params.deckId(), params.initialCardId(), params.initialCardSceneDataUrl());
  }
};

struct RequestScreenshotReceiver {
  inline static const BridgeRegistration<RequestScreenshotReceiver> registration {
    "REQUEST_SCREENSHOT"
  };

  struct Params {
  } params;
  void receive(Engine &engine) {
    auto screen = engine.maybeGetScreen();

    if (screen && screen->hasScene()) {
      screen->getScene().sendScreenshot(engine.getIsEditing(), engine.getScreenshot());
    }
  }
};
