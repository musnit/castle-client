#include "precomp.h"

#include "engine.h"


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


struct PropAttribs {
  PropAttribs &uiStyle(const char *) {
    return *this;
  }
  PropAttribs &min(int) {
    return *this;
  }
  PropAttribs &max(int) {
    return *this;
  }
};

template<typename Value, typename Internal>
struct Prop {
  Value value;
  inline static const PropAttribs &attribs = Internal::attribs;

  template<typename... Args>
  Prop(Args &&...args)
      : value(std::forward<Args>(args)...) {
  }

  static constexpr uint32_t nameHash() {
    return nameHs.value();
  }

  static constexpr std::string_view name() {
    return nameHs.data();
  }

private:
  static constexpr auto nameHs = entt::hashed_string(Internal::nameStr);
};

template<typename T>
struct PropTypeFix;
template<typename T, typename U>
struct PropTypeFix<T(U)> {
  using Type = U;
};

#define PROP(type, name, ...)                                                                      \
private:                                                                                           \
  struct INTERNAL_##name {                                                                         \
    static constexpr const char nameStr[] = #name;                                                 \
    inline static PropAttribs attribs = PropAttribs() __VA_ARGS__;                                 \
  };                                                                                               \
                                                                                                   \
public:                                                                                            \
  Prop<PropTypeFix<void(type)>::Type, INTERNAL_##name> name

struct TestProps {
  PROP(int, hello, .uiStyle("slider").min(0).max(1)) = 32;
  PROP(std::string, bar) = "woah";
  PROP((std::pair<int, int>), woo) = { 3, 2 };
};


// Main web and desktop entrypoint
#undef main // SDL does some weird stuff overriding `main` with a macro...
int main() {
  TestProps props;

  boost::pfr::for_each_field(props, [&](auto &prop) {
    if constexpr (std::remove_reference_t<decltype(prop)>::name() == "hello") {
      fmt::print("{}: {}\n", prop.name(), prop.value);
    }
  });

  Engine eng;
  loop([&]() {
    return eng.frame();
  });
  return 0;
}
