#include "precomp.h"

#include "libraries/physfs/physfs.h"


// Love

namespace love {
namespace filesystem {
  // Love's filesystem module depends on this symbol. It's defined in
  // 'wrap_FileSystem.cpp', which is for wrapping C++ to Lua. We don't include
  // that, so we just copy the implementation here.
  bool hack_setupWriteDirectory() {
    if (Module::getInstance<Filesystem>(Module::M_FILESYSTEM) != 0)
      return Module::getInstance<Filesystem>(Module::M_FILESYSTEM)->setupWriteDirectory();
    return false;
  }
} // namespace filesystem
} // namespace love

struct Love {
  love::filesystem::physfs::Filesystem filesystem;
  love::timer::Timer timer;
};
Love lv;


int main() {
  lv.filesystem.init("/castle-core");
  PHYSFS_mount(".", "/", true);

  fmt::print("hello, world!\n");
  fmt::print("welcome to castle core...\n");

  auto data = lv.filesystem.read("assets/keepme.txt");
  std::string str;
  str.resize(data->getSize());
  std::memcpy(&str[0], data->getData(), str.size());
  fmt::print("contents: {}\n", str);

  return 0;
}
