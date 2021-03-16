#include "precomp.h"

#include "libraries/physfs/physfs.h"


// Love

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

struct Love {
  love::filesystem::physfs::Filesystem filesystem;
  love::timer::Timer timer;
  love::event::sdl::Event event;
  love::touch::sdl::Touch touch;
  love::mouse::sdl::Mouse mouse;
  love::system::sdl::System system;
  love::window::sdl::Window window;
};
Love lv;


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
    love::window::WindowSettings settings;
    settings.highdpi = true;
    lv.window.setWindow(500, 700, &settings);
  }

  // Main loop
  SDL_SetHint(SDL_HINT_TOUCH_MOUSE_EVENTS, "0");
  lv.timer.step();
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

    return true;
  });

  return 0;
}
