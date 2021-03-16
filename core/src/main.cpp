#include "precomp.h"

#include "libraries/physfs/physfs.h"


// Love

#include "love_default_shaders.h"

namespace love {
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
  LOVE_MODULE(love::graphics::opengl::Graphics, graphics);

public:
  void setupDefaultShaderCode() {
    using namespace love::graphics;

    // We force ESSL1 for all shaders. Also, WebGL doesn't support array textures (I think...), so
    // we just use 'pixel' rather than 'arraypixel'.

    /* clang-format off */
    Graphics::defaultShaderCode[Shader::STANDARD_DEFAULT][Shader::LANGUAGE_GLSL1][0].source[ShaderStage::STAGE_VERTEX] = love_default_essl1_vertex;
    Graphics::defaultShaderCode[Shader::STANDARD_DEFAULT][Shader::LANGUAGE_GLSL1][0].source[ShaderStage::STAGE_PIXEL] = love_default_essl1_pixel;
    Graphics::defaultShaderCode[Shader::STANDARD_VIDEO][Shader::LANGUAGE_GLSL1][0].source[ShaderStage::STAGE_VERTEX] = love_default_essl1_vertex;
    Graphics::defaultShaderCode[Shader::STANDARD_VIDEO][Shader::LANGUAGE_GLSL1][0].source[ShaderStage::STAGE_PIXEL] = love_default_essl1_videopixel;
    Graphics::defaultShaderCode[Shader::STANDARD_ARRAY][Shader::LANGUAGE_GLSL1][0].source[ShaderStage::STAGE_VERTEX] = love_default_essl1_vertex;
    Graphics::defaultShaderCode[Shader::STANDARD_ARRAY][Shader::LANGUAGE_GLSL1][0].source[ShaderStage::STAGE_PIXEL] = love_default_essl1_pixel;

    Graphics::defaultShaderCode[Shader::STANDARD_DEFAULT][Shader::LANGUAGE_ESSL1][0].source[ShaderStage::STAGE_VERTEX] = love_default_essl1_vertex;
    Graphics::defaultShaderCode[Shader::STANDARD_DEFAULT][Shader::LANGUAGE_ESSL1][0].source[ShaderStage::STAGE_PIXEL] = love_default_essl1_pixel;
    Graphics::defaultShaderCode[Shader::STANDARD_VIDEO][Shader::LANGUAGE_ESSL1][0].source[ShaderStage::STAGE_VERTEX] = love_default_essl1_vertex;
    Graphics::defaultShaderCode[Shader::STANDARD_VIDEO][Shader::LANGUAGE_ESSL1][0].source[ShaderStage::STAGE_PIXEL] = love_default_essl1_videopixel;
    Graphics::defaultShaderCode[Shader::STANDARD_ARRAY][Shader::LANGUAGE_ESSL1][0].source[ShaderStage::STAGE_VERTEX] = love_default_essl1_vertex;
    Graphics::defaultShaderCode[Shader::STANDARD_ARRAY][Shader::LANGUAGE_ESSL1][0].source[ShaderStage::STAGE_PIXEL] = love_default_essl1_pixel;

    Graphics::defaultShaderCode[Shader::STANDARD_DEFAULT][Shader::LANGUAGE_GLSL3][0].source[ShaderStage::STAGE_VERTEX] = love_default_essl1_vertex;
    Graphics::defaultShaderCode[Shader::STANDARD_DEFAULT][Shader::LANGUAGE_GLSL3][0].source[ShaderStage::STAGE_PIXEL] = love_default_essl1_pixel;
    Graphics::defaultShaderCode[Shader::STANDARD_VIDEO][Shader::LANGUAGE_GLSL3][0].source[ShaderStage::STAGE_VERTEX] = love_default_essl1_vertex;
    Graphics::defaultShaderCode[Shader::STANDARD_VIDEO][Shader::LANGUAGE_GLSL3][0].source[ShaderStage::STAGE_PIXEL] = love_default_essl1_videopixel;
    Graphics::defaultShaderCode[Shader::STANDARD_ARRAY][Shader::LANGUAGE_GLSL3][0].source[ShaderStage::STAGE_VERTEX] = love_default_essl1_vertex;
    Graphics::defaultShaderCode[Shader::STANDARD_ARRAY][Shader::LANGUAGE_GLSL3][0].source[ShaderStage::STAGE_PIXEL] = love_default_essl1_pixel;

    Graphics::defaultShaderCode[Shader::STANDARD_DEFAULT][Shader::LANGUAGE_ESSL3][0].source[ShaderStage::STAGE_VERTEX] = love_default_essl1_vertex;
    Graphics::defaultShaderCode[Shader::STANDARD_DEFAULT][Shader::LANGUAGE_ESSL3][0].source[ShaderStage::STAGE_PIXEL] = love_default_essl1_pixel;
    Graphics::defaultShaderCode[Shader::STANDARD_VIDEO][Shader::LANGUAGE_ESSL3][0].source[ShaderStage::STAGE_VERTEX] = love_default_essl1_vertex;
    Graphics::defaultShaderCode[Shader::STANDARD_VIDEO][Shader::LANGUAGE_ESSL3][0].source[ShaderStage::STAGE_PIXEL] = love_default_essl1_videopixel;
    Graphics::defaultShaderCode[Shader::STANDARD_ARRAY][Shader::LANGUAGE_ESSL3][0].source[ShaderStage::STAGE_VERTEX] = love_default_essl1_vertex;
    Graphics::defaultShaderCode[Shader::STANDARD_ARRAY][Shader::LANGUAGE_ESSL3][0].source[ShaderStage::STAGE_PIXEL] = love_default_essl1_pixel;

    Graphics::defaultShaderCode[Shader::STANDARD_DEFAULT][Shader::LANGUAGE_GLSL1][1].source[ShaderStage::STAGE_VERTEX] = love_default_gammacorrect_essl1_vertex;
    Graphics::defaultShaderCode[Shader::STANDARD_DEFAULT][Shader::LANGUAGE_GLSL1][1].source[ShaderStage::STAGE_PIXEL] = love_default_gammacorrect_essl1_pixel;
    Graphics::defaultShaderCode[Shader::STANDARD_VIDEO][Shader::LANGUAGE_GLSL1][1].source[ShaderStage::STAGE_VERTEX] = love_default_gammacorrect_essl1_vertex;
    Graphics::defaultShaderCode[Shader::STANDARD_VIDEO][Shader::LANGUAGE_GLSL1][1].source[ShaderStage::STAGE_PIXEL] = love_default_gammacorrect_essl1_videopixel;
    Graphics::defaultShaderCode[Shader::STANDARD_ARRAY][Shader::LANGUAGE_GLSL1][1].source[ShaderStage::STAGE_VERTEX] = love_default_gammacorrect_essl1_vertex;
    Graphics::defaultShaderCode[Shader::STANDARD_ARRAY][Shader::LANGUAGE_GLSL1][1].source[ShaderStage::STAGE_PIXEL] = love_default_gammacorrect_essl1_pixel;

    Graphics::defaultShaderCode[Shader::STANDARD_DEFAULT][Shader::LANGUAGE_ESSL1][1].source[ShaderStage::STAGE_VERTEX] = love_default_gammacorrect_essl1_vertex;
    Graphics::defaultShaderCode[Shader::STANDARD_DEFAULT][Shader::LANGUAGE_ESSL1][1].source[ShaderStage::STAGE_PIXEL] = love_default_gammacorrect_essl1_pixel;
    Graphics::defaultShaderCode[Shader::STANDARD_VIDEO][Shader::LANGUAGE_ESSL1][1].source[ShaderStage::STAGE_VERTEX] = love_default_gammacorrect_essl1_vertex;
    Graphics::defaultShaderCode[Shader::STANDARD_VIDEO][Shader::LANGUAGE_ESSL1][1].source[ShaderStage::STAGE_PIXEL] = love_default_gammacorrect_essl1_videopixel;
    Graphics::defaultShaderCode[Shader::STANDARD_ARRAY][Shader::LANGUAGE_ESSL1][1].source[ShaderStage::STAGE_VERTEX] = love_default_gammacorrect_essl1_vertex;
    Graphics::defaultShaderCode[Shader::STANDARD_ARRAY][Shader::LANGUAGE_ESSL1][1].source[ShaderStage::STAGE_PIXEL] = love_default_gammacorrect_essl1_pixel;

    Graphics::defaultShaderCode[Shader::STANDARD_DEFAULT][Shader::LANGUAGE_GLSL3][1].source[ShaderStage::STAGE_VERTEX] = love_default_gammacorrect_essl1_vertex;
    Graphics::defaultShaderCode[Shader::STANDARD_DEFAULT][Shader::LANGUAGE_GLSL3][1].source[ShaderStage::STAGE_PIXEL] = love_default_gammacorrect_essl1_pixel;
    Graphics::defaultShaderCode[Shader::STANDARD_VIDEO][Shader::LANGUAGE_GLSL3][1].source[ShaderStage::STAGE_VERTEX] = love_default_gammacorrect_essl1_vertex;
    Graphics::defaultShaderCode[Shader::STANDARD_VIDEO][Shader::LANGUAGE_GLSL3][1].source[ShaderStage::STAGE_PIXEL] = love_default_gammacorrect_essl1_videopixel;
    Graphics::defaultShaderCode[Shader::STANDARD_ARRAY][Shader::LANGUAGE_GLSL3][1].source[ShaderStage::STAGE_VERTEX] = love_default_gammacorrect_essl1_vertex;
    Graphics::defaultShaderCode[Shader::STANDARD_ARRAY][Shader::LANGUAGE_GLSL3][1].source[ShaderStage::STAGE_PIXEL] = love_default_gammacorrect_essl1_pixel;

    Graphics::defaultShaderCode[Shader::STANDARD_DEFAULT][Shader::LANGUAGE_ESSL3][1].source[ShaderStage::STAGE_VERTEX] = love_default_gammacorrect_essl1_vertex;
    Graphics::defaultShaderCode[Shader::STANDARD_DEFAULT][Shader::LANGUAGE_ESSL3][1].source[ShaderStage::STAGE_PIXEL] = love_default_gammacorrect_essl1_pixel;
    Graphics::defaultShaderCode[Shader::STANDARD_VIDEO][Shader::LANGUAGE_ESSL3][1].source[ShaderStage::STAGE_VERTEX] = love_default_gammacorrect_essl1_vertex;
    Graphics::defaultShaderCode[Shader::STANDARD_VIDEO][Shader::LANGUAGE_ESSL3][1].source[ShaderStage::STAGE_PIXEL] = love_default_gammacorrect_essl1_videopixel;
    Graphics::defaultShaderCode[Shader::STANDARD_ARRAY][Shader::LANGUAGE_ESSL3][1].source[ShaderStage::STAGE_VERTEX] = love_default_gammacorrect_essl1_vertex;
    Graphics::defaultShaderCode[Shader::STANDARD_ARRAY][Shader::LANGUAGE_ESSL3][1].source[ShaderStage::STAGE_PIXEL] = love_default_gammacorrect_essl1_pixel;
    /* clang-format on */
  }
};
Love lv;


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
    love::window::WindowSettings settings;
    settings.highdpi = true;
    lv.window.setWindow(500, 700, &settings);
  }

  // Main loop
  SDL_SetHint(SDL_HINT_TOUCH_MOUSE_EVENTS, "0"); // Don't doublecount touches as mouse events
  lv.timer.step(); // First timer step
  run([&]() {
    // Process events
    lv.event.pump();
    love::event::Message *msgp = nullptr;
    while (lv.event.poll(msgp)) {
    }

    // Step timer
    lv.timer.step();

    // Update
    if (lv.mouse.isDown({ 1 })) {
      double x, y;
      lv.mouse.getPosition(x, y);
      fmt::print("mouse: {} {}\n", x, y);
    }
    for (const auto &touch : lv.touch.getTouches()) {
      fmt::print("touch: {} {} {} {} {}\n", touch.id, touch.x, touch.y, touch.dx, touch.dy);
    }

    // Draw
    {
      lv.graphics.origin();

      lv.graphics.clear(love::Colorf(227.0 / 255, 230.0 / 255, 252.0 / 255, 1), {}, {});

      lv.graphics.present(nullptr);
    }

    return true;
  });

  return 0;
}
