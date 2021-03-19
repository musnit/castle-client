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
  Lv lv { 800, 450 };
  love::RandomGenerator rng;

  int prevWindowWidth = 0, prevWindowHeight = 0;
  bool shouldQuit = false;

  std::unique_ptr<love::Font> debugFont { lv.graphics.newDefaultFont(
      14, love::TrueTypeRasterizer::HINTING_NORMAL) };


  // Rects bench
  static constexpr auto N = 40000;
  struct Rect {
    double x, y;
    double r, g, b;
    double speed;
    double w, h;
    double phase;
  };
  std::vector<Rect> rects;


  void init();

  void update(double dt);

  void draw();
};
