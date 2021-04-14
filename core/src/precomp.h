// This header file is 'precompiled' -- the compiler caches the parsed form of
// headers it includes, to improve compile times. Mostly useful to put a bunch
// of headers here that don't change much and are referenced in a lot of places
// (eg. external library headers).

#pragma once

// Standard library
#include <memory>
#include <tuple>
#include <utility>
#include <fstream>
#include <optional>
#include <unordered_map>
#include <filesystem>

// Emscripten
#ifdef __EMSCRIPTEN__
#include <emscripten/bind.h>
#include <emscripten/emscripten.h>
#endif

// fmt
#include <fmt/format.h>
#include <fmt/ranges.h>

// Love
#include <modules/data/DataModule.h>
#include <modules/math/RandomGenerator.h>
#include <modules/filesystem/physfs/Filesystem.h>
#include <modules/timer/Timer.h>
#include <modules/event/sdl/Event.h>
#include <modules/touch/sdl/Touch.h>
#include <modules/mouse/sdl/Mouse.h>
#include <modules/keyboard/sdl/Keyboard.h>
#include <modules/system/sdl/System.h>
#include <modules/image/Image.h>
#include <modules/font/freetype/Font.h>
#include <modules/graphics/opengl/Graphics.h>
#include <modules/window/sdl/Window.h>

// Box2D (disambiguate vs. Love's version)
#include <../vendor/box2d/include/box2d/box2d.h>

// entt
#include <entt/entity/registry.hpp>

// magic_get
#include <boost/pfr.hpp>

// rapidjson
#include "rapidjson/document.h"
#include "rapidjson/istreamwrapper.h"
#include "rapidjson/ostreamwrapper.h"
#include "rapidjson/prettywriter.h"
#include "rapidjson/writer.h"
namespace json = rapidjson;

// SmallVector
#include "utils/small_vector.h"
