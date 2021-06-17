#include "engine.h"

#include "js.h"
#include "api.h"


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
// Pre-init
//

Engine::PreInit::PreInit() {
  // Set debug based on flag in web, always enabled on other targets (for now)
#ifdef __EMSCRIPTEN__
  Debug::isEnabled = JS_isDebugEnabled();
#else
  Debug::isEnabled = true;
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

Engine::Engine(bool isEditing_)
    : isEditing(isEditing_) {
  // First timer step
  lv.timer.step();
  if (isEditing) {
    editor = new Editor(bridge, lv);
  }
}

Engine::~Engine() {
  if (isEditing) {
    delete editor;
  }
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
          SceneLoadedEvent event;
          getBridge().sendEvent("SCENE_LOADED", event);
        });
      });
    });
  });
}

void Engine::loadSceneFromDeckId(const char *deckId) {
  API::loadDeck(
      deckId,
      [=](Reader &reader) {
        if (isEditing) {
          editor->readVariables(reader);
        } else {
          player.readVariables(reader);
        }
      },
      [=](Reader &reader) {
        if (isEditing) {
          editor->readScene(reader);
        } else {
          player.readScene(reader);
        }
        SceneLoadedEvent event;
        getBridge().sendEvent("SCENE_LOADED", event);
      });
}

void Engine::loadSceneFromCardId(const char *cardId) {
  API::loadCard(cardId, [=](Reader &reader) {
    if (isEditing) {
      editor->readScene(reader);
    } else {
      player.readScene(reader);
    }
    SceneLoadedEvent event;
    getBridge().sendEvent("SCENE_LOADED", event);
  });
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
  {
    // TODO: android
    ghostScreenScaling = 1.0;
  }
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

void Engine::update(double dt) {
  if (isEditing) {
    // TODO: switching cards in editor?
  } else {
    if (player.hasScene() && player.getScene().getNextCardId()) {
      loadSceneFromCardId(player.getScene().getNextCardId()->c_str());
      player.getScene().setNextCardId(std::nullopt);
    }
  }

  if (isEditing) {
    editor->update(dt);
  } else {
    player.update(dt);
  }

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
    player.draw();
  }

#ifdef CASTLE_ENABLE_TESTS
  tests.draw();
#endif
}


//
// Bridge events testing
//

struct TestReceiver {
  inline static const BridgeRegistration<TestReceiver> registration { "test" };

  struct Params {
    PROP(double, topLevel) = 0;
    struct Elem {
      PROP(double, foo) = 42;
      PROP(std::string, bar) = "default";
    };
    PROP(std::vector<Elem>, elems);
  } params;

  struct TestResponse {
    PROP(double, moreTopLevel) = 9001;
    struct Elem {
      PROP(double, foo);
      PROP(std::string, bar);
    };
    PROP(std::vector<Elem>, elems);
  } response;

  void receive(Engine &engine) {
    Debug::log("core: received test event:");
    Debug::log("  topLevel: {}", params.topLevel());
    Debug::log("  elems: {}", params.topLevel());
    for (auto &elem : params.elems()) {
      Debug::log("    foo: {}, bar: '{}'", elem.foo(), elem.bar());
    }

    TestResponse response;
    response.elems().push_back({ 3, "three" });
    response.elems().push_back({ 400, "four hundred" });
    engine.getBridge().sendEvent("test_response", response);
  }
};

struct ClearSceneReceiver {
  inline static const BridgeRegistration<ClearSceneReceiver> registration { "CLEAR_SCENE" };

  struct Params {
    PROP(int, code) = 0;
  } params;

  void receive(Engine &engine) {
    Debug::log("core: received CLEAR_SCENE");
    // TODO: clear scene
  }
};

struct PreloadDeckReceiver {
  inline static const BridgeRegistration<PreloadDeckReceiver> registration { "PRELOAD_DECK" };

  struct Params {
    PROP(std::string, deckId);
  } params;

  void receive(Engine &engine) {
    API::preloadDeck(params.deckId());
  }
};
