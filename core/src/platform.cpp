#include "platform.h"


std::string Platform::getAssetPath(const char *filename) {
#if LOVE_MACOSX
  return std::string("../../../assets/") + filename;
#else
  return std::string("assets/") + filename;
#endif
}
