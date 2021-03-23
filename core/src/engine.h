#pragma once

#include "precomp.h"

#include "lv.h"
#include "scene.h"
#include "tests.h"


class Engine {
  // The top-level instance of Castle core. There should just be one of these
  // for the entire program. Multiplicity of scenes is managed by having
  // multiple `Scene` instances.
  //
  // This class initializes the various modules involved in Castle core and
  // contains the top-level logic run on each frame of the main loop.

public:
  Engine(const Engine &) = delete; // Prevent accidental copies
  const Engine &operator=(const Engine &) = delete;

  Engine();
  ~Engine();

  // Run one frame of the main loop. Return `false` if we should quit.
  bool frame();


private:
  Lv lv { 800, 1120 };
  love::RandomGenerator rng; // TODO(nikki): Seed this

  int prevWindowWidth = 0, prevWindowHeight = 0;
  bool shouldQuit = false;

  std::unique_ptr<love::Font> debugFont { lv.graphics.newDefaultFont(
      14, love::TrueTypeRasterizer::HINTING_NORMAL) };


#ifdef CASTLE_ENABLE_TESTS
  Tests tests;
#endif

  Scene scene; // Single scene for now


  void update(double dt);

  void draw();
};
