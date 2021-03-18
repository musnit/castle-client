#include "precomp.h"


namespace love {
// Bring a bunch of Love symbols into the top level of its namespace
using namespace love::filesystem;
using namespace love::timer;
using namespace love::event;
using namespace love::touch;
using namespace love::mouse;
using namespace love::keyboard;
using namespace love::system;
using namespace love::window;
using namespace love::font;
using namespace love::graphics;
using Font = love::graphics::Font;
} // namespace love


class Lv {
  // Our interface to Love's modules. Constructs and registers Love modules in
  // the right order. Also includes simple Love-related utilities.

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
  LOVE_MODULE(love::keyboard::sdl::Keyboard, keyboard);
  LOVE_MODULE(love::system::sdl::System, system);
  LOVE_MODULE(love::font::freetype::Font, font);
  LOVE_MODULE(love::graphics::opengl::Graphics, graphics);
  LOVE_MODULE(love::window::sdl::Window, window); // Important for `Window` to be last!

public:
  Lv(const Lv &) = delete; // Prevent accidental copies
  const Lv &operator=(const Lv &) = delete;

  Lv(int windowWidth, int windowHeight, const char *arg0 = "/love-app");


private:
  Lv &lv { *this };

  void setupDefaultShaderCode();
};
