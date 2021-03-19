#include "engine.h"


//
// JavaScript utilities (stubs in not-web)
//

#ifdef __EMSCRIPTEN__
// In web use
// https://emscripten.org/docs/porting/connecting_cpp_and_javascript/Interacting-with-code.html#interacting-with-code-call-javascript-from-native
#define JS_DEFINE(retType, name, ...) EM_JS(retType, name, __VA_ARGS__)
#else
// Not web. Make a stub that takes any arguments, does nothing, returns default value of `retType`
#define JS_DEFINE(retType, name, ...)                                                              \
  template<typename... Args>                                                                       \
  inline static retType name([[maybe_unused]] Args &&... args) {                                   \
    return retType();                                                                              \
  }
#endif
JS_DEFINE(int, JS_getCanvasWidth, (),
    { return document.querySelector("#canvas").getBoundingClientRect().width; });
JS_DEFINE(int, JS_getCanvasHeight, (),
    { return document.querySelector("#canvas").getBoundingClientRect().height; });
JS_DEFINE(void, JS_reload, (), { window.location.reload(); });


//
// Utilities from Ghost (old term for Castle's extended version of Love)
//

extern "C" double ghostScreenScaling; // Globally scales rendering and touch coordinates
extern "C" bool ghostChildWindowCloseEventReceived; // Whether the OS tried to close the window


//
// Constructor, destructor
//

Engine::Engine() {
  // SDL parameters
  SDL_SetHint(SDL_HINT_TOUCH_MOUSE_EVENTS, "0"); // Don't doublecount touches as mouse events

  // First timer step
  lv.timer.step();

  init();
}

Engine::~Engine() {
}


//
// Frame
//

bool Engine::frame() {
  // Based on the main loop from 'boot.lua' in the Love codebase

  // Update window size and screen scaling based on canvas in web. This will
  // generate an `SDL_WINDOWEVENT_RESIZED`, so we do it before the event pump
  // to let Love process that immediately.
#ifdef __EMSCRIPTEN__
  {
    auto w = JS_getCanvasWidth();
    auto h = JS_getCanvasHeight();
    if (w != prevWindowWidth || h != prevWindowHeight) {
      fmt::print("canvas resized to {}, {}\n", w, h);
      SDL_SetWindowSize(lv.window.getSDLWindow(), w, h);
      ghostScreenScaling = double(w) / 800;
      prevWindowWidth = w;
      prevWindowHeight = h;
    }
  }
#endif

  // Process events. Quit if the window was closed.
  lv.event.pump();
  lv.event.clear();
  if (ghostChildWindowCloseEventReceived) {
    return false;
  }

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
// Init
//

void Engine::init() {
  // Rects bench
  for (auto i = 0; i < N; ++i) {
    Rect rect;
    rect.x = lv.graphics.getWidth() * rng.random();
    rect.y = lv.graphics.getHeight() * rng.random();
    rect.r = rng.random();
    rect.g = rng.random();
    rect.b = rng.random();
    rect.speed = 0.5 * lv.graphics.getWidth() * rng.random();
    rect.w = lv.graphics.getWidth() * rng.random() / 16.0;
    rect.h = lv.graphics.getWidth() * rng.random() / 16.0;
    rect.phase = 2 * M_PI * rng.random();
    rects.push_back(rect);
  }
}


//
// Update
//

void Engine::update([[maybe_unused]] double dt) {
  // Reload on Ctrl+R
  if (lv.keyboard.isDown({ love::Keyboard::KEY_RCTRL, love::Keyboard::KEY_LCTRL })
      && lv.keyboard.isDown({ love::Keyboard::KEY_R })) {
    JS_reload();
  }

  // Rects bench
  for (auto &rect : rects) {
    rect.x = rect.x + rect.speed * sin(lv.timer.getTime() * rect.phase) * dt;
  }
}


//
// Draw
//

void Engine::draw() {
  lv.graphics.clear(love::Colorf(0.2, 0.2, 0.2, 1), {}, {});

  // Rects bench
  for (auto &rect : rects) {
    lv.graphics.setColor(love::Colorf(rect.r, rect.g, rect.b, 1));
    lv.graphics.rectangle(love::Graphics::DrawMode::DRAW_FILL, rect.x, rect.y, rect.w, rect.h);
  }
  lv.graphics.setColor(love::Colorf(0, 0, 0, 1));
  lv.graphics.print({ { fmt::format("fps: {}", lv.timer.getFPS()), { 1, 1, 1, 1 } } },
      debugFont.get(), love::Matrix4(20, 20, 0, 1, 1, 0, 0, 0, 0));
  return;

  lv.graphics.setColor(love::Colorf(0.4, 0.4, 0.2, 1));
  if (lv.mouse.isDown({ 1 })) {
    double x, y;
    lv.mouse.getPosition(x, y);
    lv.graphics.rectangle(love::Graphics::DrawMode::DRAW_FILL, x - 40, y - 40, 80, 80, 5, 5, 40);
  }
  for (const auto &touch : lv.touch.getTouches()) {
    lv.graphics.rectangle(
        love::Graphics::DrawMode::DRAW_FILL, touch.x - 40, touch.y - 40, 80, 80, 5, 5, 40);
  }

  auto fps = fmt::format("fps: {}", lv.timer.getFPS());
  lv.graphics.setColor(love::Colorf(0, 0, 0, 1));
  lv.graphics.print(
      { { fps, { 1, 1, 1, 1 } } }, debugFont.get(), love::Matrix4(20, 20, 0, 1, 1, 0, 0, 0, 0));
}
