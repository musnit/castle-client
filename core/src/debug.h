#pragma once

// No `#include "precomp.h"` so we can put it in 'precomp.h'

#include <fmt/format.h>
#include <fmt/ranges.h>


class Debug {
  // Utilities useful for debugging: graphical display of messages, logging to the console,
  // reporting errors. Could include profiling utilities in the future.
  //
  // Methods foward arguments to `fmt::`, so any formatting string and accompanying parameters that
  // work with the functions in that library may be used (see:
  // https://github.com/fmtlib/fmt#examples).

public:
  inline static bool isEnabled = false;

  // Print a message to the console
  template<typename... Args>
  static void log(Args &&...args);

  // Print a message to the console and terminate the program
  template<typename... Args>
  static void fatal(Args &&...args);

  // Graphical display. Useful for showing values that change every frame.
  template<typename... Args>
  static void display(Args &&...args); // Add to display messages for this frame
  static std::string getAndClearDisplay();


private:
  inline static std::string displayText;
};


// Inlined implementations

template<typename... Args>
inline void Debug::log(Args &&...args) {
  if (isEnabled) {
    fmt::print(std::forward<Args>(args)...);
    fmt::print("\n");
    std::fflush(stdout);
  }
};

template<typename... Args>
inline void Debug::fatal(Args &&...args) {
  log(std::forward<Args>(args)...);
  std::abort();
};

template<typename... Args>
inline void Debug::display(Args &&...args) {
  if (isEnabled && displayText.size() < 3000) {
    displayText.append(fmt::format(std::forward<Args>(args)...));
    displayText.append("\n");
  }
};

inline std::string Debug::getAndClearDisplay() {
  return std::exchange(displayText, {});
}
