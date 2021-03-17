#include "precomp.h"

#include "libraries/physfs/physfs.h"


// Love

#include "love_default_shaders.h"

namespace love {
// Bring a bunch of Love symbols into the top level of its namespace
using namespace love::filesystem;
using namespace love::timer;
using namespace love::event;
using namespace love::touch;
using namespace love::mouse;
using namespace love::system;
using namespace love::window;
using namespace love::font;
using namespace love::graphics;
using Font = love::graphics::Font;

namespace filesystem {
  // Love's filesystem module depends on this symbol. It's defined in
  // 'wrap_FileSystem.cpp', which is for wrapping C++ to Lua. We don't include
  // that, so we just copy the implementation here.
  bool hack_setupWriteDirectory() {
    if (Module::getInstance<Filesystem>(Module::M_FILESYSTEM) != 0)
      return Module::getInstance<Filesystem>(Module::M_FILESYSTEM)->setupWriteDirectory();
    return false;
  }
} // namespace filesystem
} // namespace love

class Love {
  // Constructs and registers instances of Love modules in order

  struct RegisterModule {
    RegisterModule(love::Module &mod) {
      love::Module::registerInstance(&mod);
    }
  };
#define LOVE_MODULE(type, name)                                                                    \
public:                                                                                            \
  type name;                                                                                       \
                                                                                                   \
private:                                                                                           \
  RegisterModule reg##name {                                                                       \
    name                                                                                           \
  }

  LOVE_MODULE(love::filesystem::physfs::Filesystem, filesystem);
  LOVE_MODULE(love::timer::Timer, timer);
  LOVE_MODULE(love::event::sdl::Event, event);
  LOVE_MODULE(love::touch::sdl::Touch, touch);
  LOVE_MODULE(love::mouse::sdl::Mouse, mouse);
  LOVE_MODULE(love::system::sdl::System, system);
  LOVE_MODULE(love::window::sdl::Window, window);
  LOVE_MODULE(love::font::freetype::Font, font);
  LOVE_MODULE(love::graphics::opengl::Graphics, graphics);

public:
  void setupDefaultShaderCode() {
    using namespace love;

    /* clang-format off */
    Graphics::defaultShaderCode[Shader::STANDARD_DEFAULT][Shader::LANGUAGE_GLSL1][0].source[ShaderStage::STAGE_VERTEX] = love_default_glsl1_vertex;
    Graphics::defaultShaderCode[Shader::STANDARD_DEFAULT][Shader::LANGUAGE_GLSL1][0].source[ShaderStage::STAGE_PIXEL] = love_default_glsl1_pixel;
    Graphics::defaultShaderCode[Shader::STANDARD_VIDEO][Shader::LANGUAGE_GLSL1][0].source[ShaderStage::STAGE_VERTEX] = love_default_glsl1_vertex;
    Graphics::defaultShaderCode[Shader::STANDARD_VIDEO][Shader::LANGUAGE_GLSL1][0].source[ShaderStage::STAGE_PIXEL] = love_default_glsl1_videopixel;
    Graphics::defaultShaderCode[Shader::STANDARD_ARRAY][Shader::LANGUAGE_GLSL1][0].source[ShaderStage::STAGE_VERTEX] = love_default_glsl1_vertex;
    Graphics::defaultShaderCode[Shader::STANDARD_ARRAY][Shader::LANGUAGE_GLSL1][0].source[ShaderStage::STAGE_PIXEL] = love_default_glsl1_arraypixel;

    Graphics::defaultShaderCode[Shader::STANDARD_DEFAULT][Shader::LANGUAGE_ESSL1][0].source[ShaderStage::STAGE_VERTEX] = love_default_essl1_vertex;
    Graphics::defaultShaderCode[Shader::STANDARD_DEFAULT][Shader::LANGUAGE_ESSL1][0].source[ShaderStage::STAGE_PIXEL] = love_default_essl1_pixel;
    Graphics::defaultShaderCode[Shader::STANDARD_VIDEO][Shader::LANGUAGE_ESSL1][0].source[ShaderStage::STAGE_VERTEX] = love_default_essl1_vertex;
    Graphics::defaultShaderCode[Shader::STANDARD_VIDEO][Shader::LANGUAGE_ESSL1][0].source[ShaderStage::STAGE_PIXEL] = love_default_essl1_videopixel;
    Graphics::defaultShaderCode[Shader::STANDARD_ARRAY][Shader::LANGUAGE_ESSL1][0].source[ShaderStage::STAGE_VERTEX] = love_default_essl1_vertex;
    Graphics::defaultShaderCode[Shader::STANDARD_ARRAY][Shader::LANGUAGE_ESSL1][0].source[ShaderStage::STAGE_PIXEL] = love_default_essl1_arraypixel;

    Graphics::defaultShaderCode[Shader::STANDARD_DEFAULT][Shader::LANGUAGE_GLSL3][0].source[ShaderStage::STAGE_VERTEX] = love_default_glsl3_vertex;
    Graphics::defaultShaderCode[Shader::STANDARD_DEFAULT][Shader::LANGUAGE_GLSL3][0].source[ShaderStage::STAGE_PIXEL] = love_default_glsl3_pixel;
    Graphics::defaultShaderCode[Shader::STANDARD_VIDEO][Shader::LANGUAGE_GLSL3][0].source[ShaderStage::STAGE_VERTEX] = love_default_glsl3_vertex;
    Graphics::defaultShaderCode[Shader::STANDARD_VIDEO][Shader::LANGUAGE_GLSL3][0].source[ShaderStage::STAGE_PIXEL] = love_default_glsl3_videopixel;
    Graphics::defaultShaderCode[Shader::STANDARD_ARRAY][Shader::LANGUAGE_GLSL3][0].source[ShaderStage::STAGE_VERTEX] = love_default_glsl3_vertex;
    Graphics::defaultShaderCode[Shader::STANDARD_ARRAY][Shader::LANGUAGE_GLSL3][0].source[ShaderStage::STAGE_PIXEL] = love_default_glsl3_arraypixel;

    Graphics::defaultShaderCode[Shader::STANDARD_DEFAULT][Shader::LANGUAGE_ESSL3][0].source[ShaderStage::STAGE_VERTEX] = love_default_essl3_vertex;
    Graphics::defaultShaderCode[Shader::STANDARD_DEFAULT][Shader::LANGUAGE_ESSL3][0].source[ShaderStage::STAGE_PIXEL] = love_default_essl3_pixel;
    Graphics::defaultShaderCode[Shader::STANDARD_VIDEO][Shader::LANGUAGE_ESSL3][0].source[ShaderStage::STAGE_VERTEX] = love_default_essl3_vertex;
    Graphics::defaultShaderCode[Shader::STANDARD_VIDEO][Shader::LANGUAGE_ESSL3][0].source[ShaderStage::STAGE_PIXEL] = love_default_essl3_videopixel;
    Graphics::defaultShaderCode[Shader::STANDARD_ARRAY][Shader::LANGUAGE_ESSL3][0].source[ShaderStage::STAGE_VERTEX] = love_default_essl3_vertex;
    Graphics::defaultShaderCode[Shader::STANDARD_ARRAY][Shader::LANGUAGE_ESSL3][0].source[ShaderStage::STAGE_PIXEL] = love_default_essl3_arraypixel;

    Graphics::defaultShaderCode[Shader::STANDARD_DEFAULT][Shader::LANGUAGE_GLSL1][1].source[ShaderStage::STAGE_VERTEX] = love_default_gammacorrect_glsl1_vertex;
    Graphics::defaultShaderCode[Shader::STANDARD_DEFAULT][Shader::LANGUAGE_GLSL1][1].source[ShaderStage::STAGE_PIXEL] = love_default_gammacorrect_glsl1_pixel;
    Graphics::defaultShaderCode[Shader::STANDARD_VIDEO][Shader::LANGUAGE_GLSL1][1].source[ShaderStage::STAGE_VERTEX] = love_default_gammacorrect_glsl1_vertex;
    Graphics::defaultShaderCode[Shader::STANDARD_VIDEO][Shader::LANGUAGE_GLSL1][1].source[ShaderStage::STAGE_PIXEL] = love_default_gammacorrect_glsl1_videopixel;
    Graphics::defaultShaderCode[Shader::STANDARD_ARRAY][Shader::LANGUAGE_GLSL1][1].source[ShaderStage::STAGE_VERTEX] = love_default_gammacorrect_glsl1_vertex;
    Graphics::defaultShaderCode[Shader::STANDARD_ARRAY][Shader::LANGUAGE_GLSL1][1].source[ShaderStage::STAGE_PIXEL] = love_default_gammacorrect_glsl1_arraypixel;

    Graphics::defaultShaderCode[Shader::STANDARD_DEFAULT][Shader::LANGUAGE_ESSL1][1].source[ShaderStage::STAGE_VERTEX] = love_default_gammacorrect_essl1_vertex;
    Graphics::defaultShaderCode[Shader::STANDARD_DEFAULT][Shader::LANGUAGE_ESSL1][1].source[ShaderStage::STAGE_PIXEL] = love_default_gammacorrect_essl1_pixel;
    Graphics::defaultShaderCode[Shader::STANDARD_VIDEO][Shader::LANGUAGE_ESSL1][1].source[ShaderStage::STAGE_VERTEX] = love_default_gammacorrect_essl1_vertex;
    Graphics::defaultShaderCode[Shader::STANDARD_VIDEO][Shader::LANGUAGE_ESSL1][1].source[ShaderStage::STAGE_PIXEL] = love_default_gammacorrect_essl1_videopixel;
    Graphics::defaultShaderCode[Shader::STANDARD_ARRAY][Shader::LANGUAGE_ESSL1][1].source[ShaderStage::STAGE_VERTEX] = love_default_gammacorrect_essl1_vertex;
    Graphics::defaultShaderCode[Shader::STANDARD_ARRAY][Shader::LANGUAGE_ESSL1][1].source[ShaderStage::STAGE_PIXEL] = love_default_gammacorrect_essl1_arraypixel;

    Graphics::defaultShaderCode[Shader::STANDARD_DEFAULT][Shader::LANGUAGE_GLSL3][1].source[ShaderStage::STAGE_VERTEX] = love_default_gammacorrect_glsl3_vertex;
    Graphics::defaultShaderCode[Shader::STANDARD_DEFAULT][Shader::LANGUAGE_GLSL3][1].source[ShaderStage::STAGE_PIXEL] = love_default_gammacorrect_glsl3_pixel;
    Graphics::defaultShaderCode[Shader::STANDARD_VIDEO][Shader::LANGUAGE_GLSL3][1].source[ShaderStage::STAGE_VERTEX] = love_default_gammacorrect_glsl3_vertex;
    Graphics::defaultShaderCode[Shader::STANDARD_VIDEO][Shader::LANGUAGE_GLSL3][1].source[ShaderStage::STAGE_PIXEL] = love_default_gammacorrect_glsl3_videopixel;
    Graphics::defaultShaderCode[Shader::STANDARD_ARRAY][Shader::LANGUAGE_GLSL3][1].source[ShaderStage::STAGE_VERTEX] = love_default_gammacorrect_glsl3_vertex;
    Graphics::defaultShaderCode[Shader::STANDARD_ARRAY][Shader::LANGUAGE_GLSL3][1].source[ShaderStage::STAGE_PIXEL] = love_default_gammacorrect_glsl3_arraypixel;

    Graphics::defaultShaderCode[Shader::STANDARD_DEFAULT][Shader::LANGUAGE_ESSL3][1].source[ShaderStage::STAGE_VERTEX] = love_default_gammacorrect_essl3_vertex;
    Graphics::defaultShaderCode[Shader::STANDARD_DEFAULT][Shader::LANGUAGE_ESSL3][1].source[ShaderStage::STAGE_PIXEL] = love_default_gammacorrect_essl3_pixel;
    Graphics::defaultShaderCode[Shader::STANDARD_VIDEO][Shader::LANGUAGE_ESSL3][1].source[ShaderStage::STAGE_VERTEX] = love_default_gammacorrect_essl3_vertex;
    Graphics::defaultShaderCode[Shader::STANDARD_VIDEO][Shader::LANGUAGE_ESSL3][1].source[ShaderStage::STAGE_PIXEL] = love_default_gammacorrect_essl3_videopixel;
    Graphics::defaultShaderCode[Shader::STANDARD_ARRAY][Shader::LANGUAGE_ESSL3][1].source[ShaderStage::STAGE_VERTEX] = love_default_gammacorrect_essl3_vertex;
    Graphics::defaultShaderCode[Shader::STANDARD_ARRAY][Shader::LANGUAGE_ESSL3][1].source[ShaderStage::STAGE_PIXEL] = love_default_gammacorrect_essl3_arraypixel;
    /* clang-format on */
  }
};
Love lv;

extern "C" double ghostScreenScaling;

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
    lv.timer.sleep(0.001);
  }
#endif
}

int main() {
  fmt::print("hello, world!\n");
  fmt::print("welcome to castle core...\n");

  // Filesystem
  {
    lv.filesystem.init("/castle-core");
    PHYSFS_mount(".", "/", true);

    auto data = lv.filesystem.read("assets/keepme.txt");
    std::string str;
    str.resize(data->getSize());
    std::memcpy(&str[0], data->getData(), str.size());
    fmt::print("contents of 'assets/keepme.txt': {}\n", str);
  }

  // Window
  {
    lv.setupDefaultShaderCode(); // Window also initializes graphics, shader code needs to be ready
    love::WindowSettings settings;
    settings.highdpi = true;
    lv.window.setWindow(800, 1120, &settings); // This'll be resized-from soon in main loop
  }

  // Debug font
  auto debugFont = std::unique_ptr<love::Font>(
      lv.graphics.newDefaultFont(14, love::TrueTypeRasterizer::HINTING_NORMAL));

  // Main loop
  SDL_SetHint(SDL_HINT_TOUCH_MOUSE_EVENTS, "0"); // Don't doublecount touches as mouse events
  lv.timer.step(); // First timer step
  run([&]() {
    {
      // Update window size and screen scaling
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

    // Step timer
    lv.timer.step();

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
