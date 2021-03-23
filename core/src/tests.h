#include "precomp.h"


#define CASTLE_ENABLE_TESTS // Comment to disable. Test code compilation is skipped when disabled.

#ifdef CASTLE_ENABLE_TESTS

struct Test {
  // Base test type. Inherit from this, implement methods, and list the type in
  // `Tests::Tests()` to add a test.

  Test() = default;
  virtual ~Test() = default;

  virtual void update([[maybe_unused]] double dt) {
  }
  virtual void draw() {
  }
};

class Tests {
  // Automated tests for our various APIs. `Engine` creates an instance of
  // this and calls its methods when testing is enabled.

public:
  Tests(const Tests &) = delete; // Prevent accidental copies
  const Tests &operator=(const Tests &) = delete;

  Tests();

  void update(double dt);
  void draw();


private:
  std::vector<std::unique_ptr<Test>> tests;
};

#endif
