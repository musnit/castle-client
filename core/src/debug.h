#pragma once

// No `#include "precomp.h"` so we can put it in 'precomp.h'

#include <fmt/format.h>
#include <fmt/ranges.h>


class Debug {
  // Utilities useful for debugging: graphical display of messages, logging to the console,
  // reporting errors. Could include profiling utilities in the fufture.

public:
  // Graphical display. Useful for showing values that change every frame.
  template<typename... Args>
  static void display(Args &&...args); // Add to display messages for this frame
  static std::string getAndClearDisplay();

private:
  inline static std::string displayText;
};


// Inlined implementations

template<typename... Args>
inline void Debug::display(Args &&...args) {
  displayText.append(fmt::format(std::forward<Args>(args)...));
  displayText.append("\n");
};

inline std::string Debug::getAndClearDisplay() {
  return std::exchange(displayText, {});
}
