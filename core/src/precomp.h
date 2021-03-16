// Emscripten
#ifdef __EMSCRIPTEN__
#include <emscripten/bind.h>
#include <emscripten/emscripten.h>
#endif

// fmt
#include <fmt/format.h>

// love
#include <modules/event/sdl/Event.h>
#include <modules/filesystem/physfs/Filesystem.h>
#include <modules/graphics/opengl/Graphics.h>
#include <modules/system/sdl/System.h>
#include <modules/timer/Timer.h>
#include <modules/touch/sdl/Touch.h>
#include <modules/mouse/sdl/Mouse.h>
#include <modules/window/sdl/Window.h>
