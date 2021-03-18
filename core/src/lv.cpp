#include "lv.h"

#include "libraries/physfs/physfs.h"


// Love's filesystem module depends on this symbol. It's defined in
// 'wrap_FileSystem.cpp', which is for wrapping C++ to Lua. We don't include
// that, so we just copy the implementation here.
namespace love {
namespace filesystem {
  bool hack_setupWriteDirectory() {
    if (Module::getInstance<Filesystem>(Module::M_FILESYSTEM) != 0)
      return Module::getInstance<Filesystem>(Module::M_FILESYSTEM)->setupWriteDirectory();
    return false;
  }
} // namespace filesystem
} // namespace love


//
// Constructor, destructor
//

Lv::Lv(int windowWidth, int windowHeight, const char *arg0) {
  // Filesystem
  {
    lv.filesystem.init(arg0);
    PHYSFS_mount(".", "/", true); // Provide access to files relative to the source directory
  }

  // Window
  {
    lv.setupDefaultShaderCode(); // Window also initializes graphics, shader code needs to be ready
    love::WindowSettings settings;
    settings.highdpi = true;
    lv.window.setWindow(windowWidth, windowHeight, &settings);
  }
}


//
// Default shaders
//

#include "love_default_shaders.h"

void Lv::setupDefaultShaderCode() {
  // Based on 'wrap_Graphics.lua'. We don't (want to) make a Lua VM, so we just
  // replicate the whole logic in C++.

  using namespace love;
  auto &dsc = Graphics::defaultShaderCode;

  /* clang-format off */
  dsc[Shader::STANDARD_DEFAULT][Shader::LANGUAGE_GLSL1][0].source[ShaderStage::STAGE_VERTEX] = love_default_glsl1_vertex;
  dsc[Shader::STANDARD_DEFAULT][Shader::LANGUAGE_GLSL1][0].source[ShaderStage::STAGE_PIXEL] = love_default_glsl1_pixel;
  dsc[Shader::STANDARD_VIDEO][Shader::LANGUAGE_GLSL1][0].source[ShaderStage::STAGE_VERTEX] = love_default_glsl1_vertex;
  dsc[Shader::STANDARD_VIDEO][Shader::LANGUAGE_GLSL1][0].source[ShaderStage::STAGE_PIXEL] = love_default_glsl1_videopixel;
  dsc[Shader::STANDARD_ARRAY][Shader::LANGUAGE_GLSL1][0].source[ShaderStage::STAGE_VERTEX] = love_default_glsl1_vertex;
  dsc[Shader::STANDARD_ARRAY][Shader::LANGUAGE_GLSL1][0].source[ShaderStage::STAGE_PIXEL] = love_default_glsl1_arraypixel;

  dsc[Shader::STANDARD_DEFAULT][Shader::LANGUAGE_ESSL1][0].source[ShaderStage::STAGE_VERTEX] = love_default_essl1_vertex;
  dsc[Shader::STANDARD_DEFAULT][Shader::LANGUAGE_ESSL1][0].source[ShaderStage::STAGE_PIXEL] = love_default_essl1_pixel;
  dsc[Shader::STANDARD_VIDEO][Shader::LANGUAGE_ESSL1][0].source[ShaderStage::STAGE_VERTEX] = love_default_essl1_vertex;
  dsc[Shader::STANDARD_VIDEO][Shader::LANGUAGE_ESSL1][0].source[ShaderStage::STAGE_PIXEL] = love_default_essl1_videopixel;
  dsc[Shader::STANDARD_ARRAY][Shader::LANGUAGE_ESSL1][0].source[ShaderStage::STAGE_VERTEX] = love_default_essl1_vertex;
  dsc[Shader::STANDARD_ARRAY][Shader::LANGUAGE_ESSL1][0].source[ShaderStage::STAGE_PIXEL] = love_default_essl1_arraypixel;

  dsc[Shader::STANDARD_DEFAULT][Shader::LANGUAGE_GLSL3][0].source[ShaderStage::STAGE_VERTEX] = love_default_glsl3_vertex;
  dsc[Shader::STANDARD_DEFAULT][Shader::LANGUAGE_GLSL3][0].source[ShaderStage::STAGE_PIXEL] = love_default_glsl3_pixel;
  dsc[Shader::STANDARD_VIDEO][Shader::LANGUAGE_GLSL3][0].source[ShaderStage::STAGE_VERTEX] = love_default_glsl3_vertex;
  dsc[Shader::STANDARD_VIDEO][Shader::LANGUAGE_GLSL3][0].source[ShaderStage::STAGE_PIXEL] = love_default_glsl3_videopixel;
  dsc[Shader::STANDARD_ARRAY][Shader::LANGUAGE_GLSL3][0].source[ShaderStage::STAGE_VERTEX] = love_default_glsl3_vertex;
  dsc[Shader::STANDARD_ARRAY][Shader::LANGUAGE_GLSL3][0].source[ShaderStage::STAGE_PIXEL] = love_default_glsl3_arraypixel;

  dsc[Shader::STANDARD_DEFAULT][Shader::LANGUAGE_ESSL3][0].source[ShaderStage::STAGE_VERTEX] = love_default_essl3_vertex;
  dsc[Shader::STANDARD_DEFAULT][Shader::LANGUAGE_ESSL3][0].source[ShaderStage::STAGE_PIXEL] = love_default_essl3_pixel;
  dsc[Shader::STANDARD_VIDEO][Shader::LANGUAGE_ESSL3][0].source[ShaderStage::STAGE_VERTEX] = love_default_essl3_vertex;
  dsc[Shader::STANDARD_VIDEO][Shader::LANGUAGE_ESSL3][0].source[ShaderStage::STAGE_PIXEL] = love_default_essl3_videopixel;
  dsc[Shader::STANDARD_ARRAY][Shader::LANGUAGE_ESSL3][0].source[ShaderStage::STAGE_VERTEX] = love_default_essl3_vertex;
  dsc[Shader::STANDARD_ARRAY][Shader::LANGUAGE_ESSL3][0].source[ShaderStage::STAGE_PIXEL] = love_default_essl3_arraypixel;

  dsc[Shader::STANDARD_DEFAULT][Shader::LANGUAGE_GLSL1][1].source[ShaderStage::STAGE_VERTEX] = love_default_gammacorrect_glsl1_vertex;
  dsc[Shader::STANDARD_DEFAULT][Shader::LANGUAGE_GLSL1][1].source[ShaderStage::STAGE_PIXEL] = love_default_gammacorrect_glsl1_pixel;
  dsc[Shader::STANDARD_VIDEO][Shader::LANGUAGE_GLSL1][1].source[ShaderStage::STAGE_VERTEX] = love_default_gammacorrect_glsl1_vertex;
  dsc[Shader::STANDARD_VIDEO][Shader::LANGUAGE_GLSL1][1].source[ShaderStage::STAGE_PIXEL] = love_default_gammacorrect_glsl1_videopixel;
  dsc[Shader::STANDARD_ARRAY][Shader::LANGUAGE_GLSL1][1].source[ShaderStage::STAGE_VERTEX] = love_default_gammacorrect_glsl1_vertex;
  dsc[Shader::STANDARD_ARRAY][Shader::LANGUAGE_GLSL1][1].source[ShaderStage::STAGE_PIXEL] = love_default_gammacorrect_glsl1_arraypixel;

  dsc[Shader::STANDARD_DEFAULT][Shader::LANGUAGE_ESSL1][1].source[ShaderStage::STAGE_VERTEX] = love_default_gammacorrect_essl1_vertex;
  dsc[Shader::STANDARD_DEFAULT][Shader::LANGUAGE_ESSL1][1].source[ShaderStage::STAGE_PIXEL] = love_default_gammacorrect_essl1_pixel;
  dsc[Shader::STANDARD_VIDEO][Shader::LANGUAGE_ESSL1][1].source[ShaderStage::STAGE_VERTEX] = love_default_gammacorrect_essl1_vertex;
  dsc[Shader::STANDARD_VIDEO][Shader::LANGUAGE_ESSL1][1].source[ShaderStage::STAGE_PIXEL] = love_default_gammacorrect_essl1_videopixel;
  dsc[Shader::STANDARD_ARRAY][Shader::LANGUAGE_ESSL1][1].source[ShaderStage::STAGE_VERTEX] = love_default_gammacorrect_essl1_vertex;
  dsc[Shader::STANDARD_ARRAY][Shader::LANGUAGE_ESSL1][1].source[ShaderStage::STAGE_PIXEL] = love_default_gammacorrect_essl1_arraypixel;

  dsc[Shader::STANDARD_DEFAULT][Shader::LANGUAGE_GLSL3][1].source[ShaderStage::STAGE_VERTEX] = love_default_gammacorrect_glsl3_vertex;
  dsc[Shader::STANDARD_DEFAULT][Shader::LANGUAGE_GLSL3][1].source[ShaderStage::STAGE_PIXEL] = love_default_gammacorrect_glsl3_pixel;
  dsc[Shader::STANDARD_VIDEO][Shader::LANGUAGE_GLSL3][1].source[ShaderStage::STAGE_VERTEX] = love_default_gammacorrect_glsl3_vertex;
  dsc[Shader::STANDARD_VIDEO][Shader::LANGUAGE_GLSL3][1].source[ShaderStage::STAGE_PIXEL] = love_default_gammacorrect_glsl3_videopixel;
  dsc[Shader::STANDARD_ARRAY][Shader::LANGUAGE_GLSL3][1].source[ShaderStage::STAGE_VERTEX] = love_default_gammacorrect_glsl3_vertex;
  dsc[Shader::STANDARD_ARRAY][Shader::LANGUAGE_GLSL3][1].source[ShaderStage::STAGE_PIXEL] = love_default_gammacorrect_glsl3_arraypixel;

  dsc[Shader::STANDARD_DEFAULT][Shader::LANGUAGE_ESSL3][1].source[ShaderStage::STAGE_VERTEX] = love_default_gammacorrect_essl3_vertex;
  dsc[Shader::STANDARD_DEFAULT][Shader::LANGUAGE_ESSL3][1].source[ShaderStage::STAGE_PIXEL] = love_default_gammacorrect_essl3_pixel;
  dsc[Shader::STANDARD_VIDEO][Shader::LANGUAGE_ESSL3][1].source[ShaderStage::STAGE_VERTEX] = love_default_gammacorrect_essl3_vertex;
  dsc[Shader::STANDARD_VIDEO][Shader::LANGUAGE_ESSL3][1].source[ShaderStage::STAGE_PIXEL] = love_default_gammacorrect_essl3_videopixel;
  dsc[Shader::STANDARD_ARRAY][Shader::LANGUAGE_ESSL3][1].source[ShaderStage::STAGE_VERTEX] = love_default_gammacorrect_essl3_vertex;
  dsc[Shader::STANDARD_ARRAY][Shader::LANGUAGE_ESSL3][1].source[ShaderStage::STAGE_PIXEL] = love_default_gammacorrect_essl3_arraypixel;
  /* clang-format on */
}
