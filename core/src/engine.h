#include "precomp.h"

#include "lv.h"


class Engine {
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

  std::unique_ptr<love::Image> testImg;
  std::unique_ptr<love::Shader> testShader;


  void update(double dt);

  void draw();
};
