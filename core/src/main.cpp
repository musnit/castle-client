#include "precomp.h"

#include "lv.h"


// Calls to JS

#ifdef __EMSCRIPTEN__
EM_JS(int, JS_getCanvasWidth, (),
    { return document.querySelector("#canvas").getBoundingClientRect().width; });
EM_JS(int, JS_getCanvasHeight, (),
    { return document.querySelector("#canvas").getBoundingClientRect().height; });
#else
int JS_getCanvasWidth() {
  return 0;
}
int JS_getCanvasHeight() {
  return 0;
}
#endif

#ifdef __EMSCRIPTEN__
EM_JS(void, JS_reload, (), { window.location.reload(); });
#else
void JS_reload() {
}
#endif


// Main

template<typename F>
void run(F &&frame) {
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

extern "C" double ghostScreenScaling;
extern "C" bool ghostChildWindowCloseEventReceived;

#undef main // SDL does some weird stuff overriding `main` with a macro...
int main() {
  fmt::print("hello, world!\n");
  fmt::print("welcome to castle core...\n");

  Lv lv(800, 1120);

  // Debug font
  auto debugFont = std::unique_ptr<love::Font>(
      lv.graphics.newDefaultFont(14, love::TrueTypeRasterizer::HINTING_NORMAL));

  // Main loop
  SDL_SetHint(SDL_HINT_TOUCH_MOUSE_EVENTS, "0"); // Don't doublecount touches as mouse events
  lv.timer.step(); // First timer step
  run([&]() {
    // Update window size and screen scaling
    {
      static int prevW = 0, prevH = 0;
      auto w = JS_getCanvasWidth();
      auto h = JS_getCanvasHeight();
      if (w != prevW || h != prevH) {
        fmt::print("canvas resized to {}, {}\n", w, h);
        SDL_SetWindowSize(lv.window.getSDLWindow(), w, h);
        ghostScreenScaling = double(w) / 800;
        prevW = w;
        prevH = h;
      }
    }

    // Process events
    lv.event.pump();
    lv.event.clear();
    if (ghostChildWindowCloseEventReceived) {
      return false;
    }

    // Step timer
    lv.timer.step();

    // Reload on Ctrl+R
    if (lv.keyboard.isDown({ love::Keyboard::KEY_RCTRL, love::Keyboard::KEY_LCTRL })
        && lv.keyboard.isDown({ love::Keyboard::KEY_R })) {
      JS_reload();
    }

    // Draw
    {
      lv.graphics.origin();

      lv.graphics.clear(love::Colorf(0.2, 0.2, 0.2, 1), {}, {});

      lv.graphics.setColor(love::Colorf(0.4, 0.4, 0.2, 1));
      if (lv.mouse.isDown({ 1 })) {
        double x, y;
        lv.mouse.getPosition(x, y);
        lv.graphics.rectangle(
            love::Graphics::DrawMode::DRAW_FILL, x - 40, y - 40, 80, 80, 5, 5, 40);
      }
      for (const auto &touch : lv.touch.getTouches()) {
        lv.graphics.rectangle(
            love::Graphics::DrawMode::DRAW_FILL, touch.x - 40, touch.y - 40, 80, 80, 5, 5, 40);
      }

      auto fps = fmt::format("fps: {}", lv.timer.getFPS());
      lv.graphics.setColor(love::Colorf(0, 0, 0, 1));
      lv.graphics.print(
          { { fps, { 1, 1, 1, 1 } } }, debugFont.get(), love::Matrix4(20, 20, 0, 1, 1, 0, 0, 0, 0));

      lv.graphics.present(nullptr);
    }

    return true;
  });

  return 0;
}
