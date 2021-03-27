#include "precomp.h"

#include "engine.h"
#include "props.h"


// Run the main loop, calling `frame` per frame. `frame` should return a
// boolean that is `false` when it wants to quit. Handles both the web and
// desktop cases.
template<typename F>
void loop(F &&frame) {
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


struct TestProps {
  PROP(char, hello) = 32;
  PROP(std::string, bar) = "woah";
  int x;
};


// Main web and desktop entrypoint
#undef main // SDL does some weird stuff overriding `main` with a macro...
int main() {
  TestProps props;

  Props::forEach(props, [&](auto &prop) {
    fmt::print("{}: {}\n", prop.name(), prop.value);
  });

  Engine eng;
  loop([&]() {
    return eng.frame();
  });
  return 0;
}
