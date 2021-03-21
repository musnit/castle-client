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

  // Setup image test
  {
    /* clang-format off */
    const char base64Png[] = "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";
    /* clang-format on */
    size_t decodedLen;
    auto decoded = love::data::decode(
        love::data::ENCODE_BASE64, base64Png, sizeof(base64Png) - 1, decodedLen);
    auto byteData = std::unique_ptr<love::ByteData>(lv.data.newByteData(decoded, decodedLen, true));
    auto imgData = std::unique_ptr<love::ImageData>(lv.image.newImageData(byteData.get()));
    love::Image::Slices slices(love::TEXTURE_2D);
    slices.set(0, 0, imgData.get());
    testImg.reset(lv.graphics.newImage(slices, {}));
  }
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
// Update
//

void Engine::update([[maybe_unused]] double dt) {
  // Reload on Ctrl+R
  if (lv.keyboard.isDown({ love::Keyboard::KEY_RCTRL, love::Keyboard::KEY_LCTRL })
      && lv.keyboard.isDown({ love::Keyboard::KEY_R })) {
    JS_reload();
  }
}


//
// Draw
//

void Engine::draw() {
  lv.graphics.clear(love::Colorf(0.2, 0.2, 0.2, 1), {}, {});

  // Draw image test
  {
    lv.graphics.setColor(love::Colorf(1, 1, 1, 1));
    testImg->draw(&lv.graphics, love::Matrix4(120, 20, 0, 1, 1, 0, 0, 0, 0));
  }

  auto fps = fmt::format("fps: {}", lv.timer.getFPS());
  lv.graphics.setColor(love::Colorf(0, 0, 0, 1));
  lv.graphics.print(
      { { fps, { 1, 1, 1, 1 } } }, debugFont.get(), love::Matrix4(20, 20, 0, 1, 1, 0, 0, 0, 0));
}
