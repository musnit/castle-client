#include "lv.h"

#include "libraries/physfs/physfs.h"


// Love's filesystem module depends on this symbol. It's defined in
// 'wrap_FileSystem.cpp', which is for wrapping C++ to Lua. We don't include
// that, so we just copy the implementation here.
namespace love::filesystem {
bool hack_setupWriteDirectory() {
  if (Module::getInstance<Filesystem>(Module::M_FILESYSTEM) != nullptr) {
    return Module::getInstance<Filesystem>(Module::M_FILESYSTEM)->setupWriteDirectory();
  }
  return false;
}
}


//
// Constructor, destructor
//

Lv::Lv(int windowWidth, int windowHeight, const char *arg0) {
  instance = this;

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
// Shaders
//

std::string Lv::wrapVertexShaderCode(const char *code) {
  return wrapShaderCode(true, code);
}

std::string Lv::wrapFragmentShaderCode(const char *code) {
  return wrapShaderCode(false, code);
}

std::string Lv::wrapShaderCode(bool isVertex, const char *code) {
  bool isGles = lv.graphics.getRenderer() == love::Graphics::RENDERER_OPENGLES;
  bool isGammaCorrect = love::graphics::isGammaCorrect();

  std::string result;

  // Version
  result.append(isGles ? "#version 100\n" : "#version 120\n");

  // Stage
  result.append(isVertex ? "#define VERTEX VERTEX\n" : "#define PIXEL PIXEL\n");

  // GLSL 1 on GLSL 3 emulation
  result.append("\n"); // Skipping `LOVE_GLSL1_ON_GLSL_3`...

  // Gamma correct
  result.append(isGammaCorrect ? "#define LOVE_GAMMA_CORRECT 1\n" : "\n");

  // Syntax
  result.append(R"(
#if !defined(GL_ES) && __VERSION__ < 140
	#define lowp
	#define mediump
	#define highp
#endif
#if defined(VERTEX) || __VERSION__ > 100 || defined(GL_FRAGMENT_PRECISION_HIGH)
	#define LOVE_HIGHP_OR_MEDIUMP highp
#else
	#define LOVE_HIGHP_OR_MEDIUMP mediump
#endif
#define number float
#define Image sampler2D
#define ArrayImage sampler2DArray
#define CubeImage samplerCube
#define VolumeImage sampler3D
#if __VERSION__ >= 300 && !defined(LOVE_GLSL1_ON_GLSL3)
	#define DepthImage sampler2DShadow
	#define DepthArrayImage sampler2DArrayShadow
	#define DepthCubeImage samplerCubeShadow
#endif
#define extern uniform
#ifdef GL_EXT_texture_array
#extension GL_EXT_texture_array : enable
#endif
#ifdef GL_OES_texture_3D
#extension GL_OES_texture_3D : enable
#endif
#ifdef GL_OES_standard_derivatives
#extension GL_OES_standard_derivatives : enable
#endif
)");

  // Header
  result.append(isVertex ? R"(
#define love_Position gl_Position

#if __VERSION__ >= 130
	#define attribute in
	#define varying out
	#ifndef LOVE_GLSL1_ON_GLSL3
		#define love_VertexID gl_VertexID
		#define love_InstanceID gl_InstanceID
	#endif
#endif

#ifdef GL_ES
	uniform mediump float love_PointSize;
#endif
)"
                         : R"(
#ifdef GL_ES
	precision mediump float;
#endif

#define love_MaxCanvases gl_MaxDrawBuffers

#if __VERSION__ >= 130
	#define varying in
	layout(location = 0) out vec4 love_Canvases[love_MaxCanvases];
	#define love_PixelColor love_Canvases[0]
#else
	#define love_Canvases gl_FragData
	#define love_PixelColor gl_FragColor
#endif

// See Shader::updateScreenParams in Shader.cpp.
#define love_PixelCoord (vec2(gl_FragCoord.x, (gl_FragCoord.y * love_ScreenSize.z) + love_ScreenSize.w))
)");

  // Uniforms
  result.append(R"(
// According to the GLSL ES 1.0 spec, uniform precision must match between stages,
// but we can't guarantee that highp is always supported in fragment shaders...
// We *really* don't want to use mediump for these in vertex shaders though.
uniform LOVE_HIGHP_OR_MEDIUMP mat4 ViewSpaceFromLocal;
uniform LOVE_HIGHP_OR_MEDIUMP mat4 ClipSpaceFromView;
uniform LOVE_HIGHP_OR_MEDIUMP mat4 ClipSpaceFromLocal;
uniform LOVE_HIGHP_OR_MEDIUMP mat3 ViewNormalFromLocal;
uniform LOVE_HIGHP_OR_MEDIUMP vec4 love_ScreenSize;

// Compatibility
#define TransformMatrix ViewSpaceFromLocal
#define ProjectionMatrix ClipSpaceFromView
#define TransformProjectionMatrix ClipSpaceFromLocal
#define NormalMatrix ViewNormalFromLocal
)");

  // Functions
  result.append(R"(
#ifdef GL_ES
	#if __VERSION__ >= 300 || defined(GL_EXT_texture_array)
		precision lowp sampler2DArray;
	#endif
	#if __VERSION__ >= 300 || defined(GL_OES_texture_3D)
		precision lowp sampler3D;
	#endif
	#if __VERSION__ >= 300
		precision lowp sampler2DShadow;
		precision lowp samplerCubeShadow;
		precision lowp sampler2DArrayShadow;
	#endif
#endif

#if __VERSION__ >= 130 && !defined(LOVE_GLSL1_ON_GLSL3)
	#define Texel texture
#else
	#if __VERSION__ >= 130
		#define texture2D Texel
		#define texture3D Texel
		#define textureCube Texel
		#define texture2DArray Texel
		#define love_texture2D texture
		#define love_texture3D texture
		#define love_textureCube texture
		#define love_texture2DArray texture
	#else
		#define love_texture2D texture2D
		#define love_texture3D texture3D
		#define love_textureCube textureCube
		#define love_texture2DArray texture2DArray
	#endif
	vec4 Texel(sampler2D s, vec2 c) { return love_texture2D(s, c); }
	vec4 Texel(samplerCube s, vec3 c) { return love_textureCube(s, c); }
	#if __VERSION__ > 100 || defined(GL_OES_texture_3D)
		vec4 Texel(sampler3D s, vec3 c) { return love_texture3D(s, c); }
	#endif
	#if __VERSION__ >= 130 || defined(GL_EXT_texture_array)
		vec4 Texel(sampler2DArray s, vec3 c) { return love_texture2DArray(s, c); }
	#endif
	#ifdef PIXEL
		vec4 Texel(sampler2D s, vec2 c, float b) { return love_texture2D(s, c, b); }
		vec4 Texel(samplerCube s, vec3 c, float b) { return love_textureCube(s, c, b); }
		#if __VERSION__ > 100 || defined(GL_OES_texture_3D)
			vec4 Texel(sampler3D s, vec3 c, float b) { return love_texture3D(s, c, b); }
		#endif
		#if __VERSION__ >= 130 || defined(GL_EXT_texture_array)
			vec4 Texel(sampler2DArray s, vec3 c, float b) { return love_texture2DArray(s, c, b); }
		#endif
	#endif
	#define texture love_texture
#endif

float gammaToLinearPrecise(float c) {
	return c <= 0.04045 ? c * 0.077399380804954 : pow((c + 0.055) * 0.9478672985782, 2.4);
}
vec3 gammaToLinearPrecise(vec3 c) {
	bvec3 leq = lessThanEqual(c, vec3(0.04045));
	c.r = leq.r ? c.r * 0.077399380804954 : pow((c.r + 0.055) * 0.9478672985782, 2.4);
	c.g = leq.g ? c.g * 0.077399380804954 : pow((c.g + 0.055) * 0.9478672985782, 2.4);
	c.b = leq.b ? c.b * 0.077399380804954 : pow((c.b + 0.055) * 0.9478672985782, 2.4);
	return c;
}
vec4 gammaToLinearPrecise(vec4 c) { return vec4(gammaToLinearPrecise(c.rgb), c.a); }
float linearToGammaPrecise(float c) {
	return c < 0.0031308 ? c * 12.92 : 1.055 * pow(c, 1.0 / 2.4) - 0.055;
}
vec3 linearToGammaPrecise(vec3 c) {
	bvec3 lt = lessThanEqual(c, vec3(0.0031308));
	c.r = lt.r ? c.r * 12.92 : 1.055 * pow(c.r, 1.0 / 2.4) - 0.055;
	c.g = lt.g ? c.g * 12.92 : 1.055 * pow(c.g, 1.0 / 2.4) - 0.055;
	c.b = lt.b ? c.b * 12.92 : 1.055 * pow(c.b, 1.0 / 2.4) - 0.055;
	return c;
}
vec4 linearToGammaPrecise(vec4 c) { return vec4(linearToGammaPrecise(c.rgb), c.a); }

// http://chilliant.blogspot.com.au/2012/08/srgb-approximations-for-hlsl.html?m=1

mediump float gammaToLinearFast(mediump float c) { return c * (c * (c * 0.305306011 + 0.682171111) + 0.012522878); }
mediump vec3 gammaToLinearFast(mediump vec3 c) { return c * (c * (c * 0.305306011 + 0.682171111) + 0.012522878); }
mediump vec4 gammaToLinearFast(mediump vec4 c) { return vec4(gammaToLinearFast(c.rgb), c.a); }

mediump float linearToGammaFast(mediump float c) { return max(1.055 * pow(max(c, 0.0), 0.41666666) - 0.055, 0.0); }
mediump vec3 linearToGammaFast(mediump vec3 c) { return max(1.055 * pow(max(c, vec3(0.0)), vec3(0.41666666)) - 0.055, vec3(0.0)); }
mediump vec4 linearToGammaFast(mediump vec4 c) { return vec4(linearToGammaFast(c.rgb), c.a); }

#define gammaToLinear gammaToLinearFast
#define linearToGamma linearToGammaFast

#ifdef LOVE_GAMMA_CORRECT
	#define gammaCorrectColor gammaToLinear
	#define unGammaCorrectColor linearToGamma
	#define gammaCorrectColorPrecise gammaToLinearPrecise
	#define unGammaCorrectColorPrecise linearToGammaPrecise
	#define gammaCorrectColorFast gammaToLinearFast
	#define unGammaCorrectColorFast linearToGammaFast
#else
	#define gammaCorrectColor
	#define unGammaCorrectColor
	#define gammaCorrectColorPrecise
	#define unGammaCorrectColorPrecise
	#define gammaCorrectColorFast
	#define unGammaCorrectColorFast
#endif
)");

  // Stage-specific functions
  result.append(isVertex ? R"(
void setPointSize() {
#ifdef GL_ES
	gl_PointSize = love_PointSize;
#endif
}
)"
                         : R"(
uniform sampler2D love_VideoYChannel;
uniform sampler2D love_VideoCbChannel;
uniform sampler2D love_VideoCrChannel;

vec4 VideoTexel(vec2 texcoords) {
	vec3 yuv;
	yuv[0] = Texel(love_VideoYChannel, texcoords).r;
	yuv[1] = Texel(love_VideoCbChannel, texcoords).r;
	yuv[2] = Texel(love_VideoCrChannel, texcoords).r;
	yuv += vec3(-0.0627451017, -0.501960814, -0.501960814);

	vec4 color;
	color.r = dot(yuv, vec3(1.164,  0.000,  1.596));
	color.g = dot(yuv, vec3(1.164, -0.391, -0.813));
	color.b = dot(yuv, vec3(1.164,  2.018,  0.000));
	color.a = 1.0;

	return gammaCorrectColor(color);
}
)");

  // Main
  result.append(isVertex ? R"(
attribute vec4 VertexPosition;
attribute vec4 VertexTexCoord;
attribute vec4 VertexColor;
attribute vec4 ConstantColor;

varying vec4 VaryingTexCoord;
varying vec4 VaryingColor;

vec4 position(mat4 clipSpaceFromLocal, vec4 localPosition);

void main() {
	VaryingTexCoord = VertexTexCoord;
	VaryingColor = gammaCorrectColor(VertexColor) * ConstantColor;
	setPointSize();
	love_Position = position(ClipSpaceFromLocal, VertexPosition);
}
)"
                         : R"(
uniform sampler2D MainTex;
varying LOVE_HIGHP_OR_MEDIUMP vec4 VaryingTexCoord;
varying mediump vec4 VaryingColor;

vec4 effect(vec4 vcolor, Image tex, vec2 texcoord, vec2 pixcoord);

void main() {
	love_PixelColor = effect(VaryingColor, MainTex, VaryingTexCoord.st, love_PixelCoord);
}
)");

  // Line number
  result.append(isGles ? "#line 1\n" : "#line 0\n");

  // Body
  result.append(code);
  result.append("\n");

  return result;
}

#include "lv_default_shaders.h"

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
