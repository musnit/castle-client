// This header file is 'precompiled' -- the compiler caches the parsed form of
// headers it includes, to improve compile times. Mostly useful to put a bunch
// of headers here that don't change much and are referenced in a lot of places
// (eg. external library headers).

// Standard library
#include <memory>

// Emscripten
#ifdef __EMSCRIPTEN__
#include <emscripten/bind.h>
#include <emscripten/emscripten.h>
#endif

// fmt
#include <fmt/format.h>

// love
#include <modules/math/RandomGenerator.h>
#include <modules/filesystem/physfs/Filesystem.h>
#include <modules/timer/Timer.h>
#include <modules/event/sdl/Event.h>
#include <modules/touch/sdl/Touch.h>
#include <modules/mouse/sdl/Mouse.h>
#include <modules/keyboard/sdl/Keyboard.h>
#include <modules/system/sdl/System.h>
#include <modules/font/freetype/Font.h>
#include <modules/graphics/opengl/Graphics.h>
#include <modules/window/sdl/Window.h>
