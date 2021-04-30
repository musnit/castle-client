#pragma once

#ifdef __EMSCRIPTEN__
// In web use
// https://emscripten.org/docs/porting/connecting_cpp_and_javascript/Interacting-with-code.html#interacting-with-code-call-javascript-from-native
#define JS_DEFINE(retType, name, ...) EM_JS(retType, name, __VA_ARGS__)
#else
// Not web. Make a stub that takes any arguments, does nothing, returns default value of `retType`
#define JS_DEFINE(retType, name, ...)                                                              \
  template<typename... Args>                                                                       \
  inline static retType name(Args &&...args) {                                                     \
    return {};                                                                                     \
  }
#endif
