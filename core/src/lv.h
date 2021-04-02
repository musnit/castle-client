#pragma once

#include "precomp.h"


namespace love {
// Bring a bunch of Love symbols into the top level of its namespace
using namespace love::data;
using namespace love::math;
using namespace love::filesystem;
using namespace love::timer;
using namespace love::event;
using namespace love::touch;
using namespace love::mouse;
using namespace love::keyboard;
using namespace love::system;
using namespace love::image;
using namespace love::font;
using namespace love::graphics;
using namespace love::ghost;
using namespace love::window;
using Image = love::graphics::Image;
using Font = love::graphics::Font;
}


class Lv {
  // Our interface to Love's modules. Love itself has 'love.{h,cpp}' and the
  // `love` namespace, so we're calling this `Lv` / `lv` to disambiguate.
  //
  // Constructs and registers modules in the right order. Registration is
  // required for the modules to cross-reference each other properly
  // internally. Also includes simple Love-related utilities.

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

public:
  love::data::DataModule &data { love::data::DataModule::instance };
  LOVE_MODULE(love::filesystem::physfs::Filesystem, filesystem);
  LOVE_MODULE(love::timer::Timer, timer);
  LOVE_MODULE(love::event::sdl::Event, event);
  LOVE_MODULE(love::touch::sdl::Touch, touch);
  LOVE_MODULE(love::mouse::sdl::Mouse, mouse);
  LOVE_MODULE(love::keyboard::sdl::Keyboard, keyboard);
  LOVE_MODULE(love::system::sdl::System, system);
  LOVE_MODULE(love::image::Image, image);
  LOVE_MODULE(love::font::freetype::Font, font);
  LOVE_MODULE(love::graphics::opengl::Graphics, graphics);
  LOVE_MODULE(love::window::sdl::Window, window); // Important for `Window` to be last!

public:
  Lv(const Lv &) = delete; // Prevent accidental copies
  const Lv &operator=(const Lv &) = delete;

  Lv(int windowWidth, int windowHeight, const char *arg0 = "/love-app");

  static Lv &getInstance();

  // Add Love boilerplate around shader code. This is required for the
  // Love-specific extensions to GLSL to work (eg. variables like
  // `TransformMatrix` or using `effect` as the entrypoint)
  std::string wrapVertexShaderCode(const char *code);
  std::string wrapFragmentShaderCode(const char *code);


private:
  Lv &lv { *this };

  inline static Lv *instance = nullptr;

  std::string wrapShaderCode(bool isVertex, const char *code);
  void setupDefaultShaderCode();
};


// Inline implementations

inline Lv &Lv::getInstance() {
  return *instance;
}
