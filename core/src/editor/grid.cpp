#include "grid.h"


//
// Constructor, destructor
//

Grid::Grid(Style style_)
    : style(style_) {
  switch (style) {
  case Style::Dot:
    makeDotShader();
    break;
  case Style::Cross:
    makeCrossShader();
    break;
  }
}

void Grid::makeDotShader() {
  static const char vert[] = R"(
    vec4 position(mat4 transformProjection, vec4 vertexPosition) {
      return transformProjection * vertexPosition;
    }
  )";
  static const char frag[] = R"(
    uniform float gridCellSize;
    uniform float gridSize;
    uniform float dotRadius;
    uniform vec2 offset;
    uniform vec2 viewOffset;
    uniform bool onlyAxes;

    vec4 effect(vec4 color, Image tex, vec2 texCoords, vec2 screenCoords) {
      vec2 f = mod(screenCoords + offset + dotRadius, gridCellSize);
      float l = length(f - dotRadius);
      float s = 1.0 - smoothstep(dotRadius - 1.0, dotRadius + 1.0, l);
      vec2 distToAxis = screenCoords - viewOffset;

      if (gridSize > 0.0 && (abs(distToAxis.x) > gridSize || abs(distToAxis.y) > gridSize)) {
        discard;
      }

      if (onlyAxes) {
        if (abs(distToAxis.x) < dotRadius || abs(distToAxis.y) < dotRadius) {
          return vec4(color.rgb, s * color.a);
        } else {
          discard;
        }
      } else {
        return vec4(color.rgb, s * color.a);
      }
    }
  )";
  shader.reset(
      lv.graphics.newShader(lv.wrapVertexShaderCode(vert), lv.wrapFragmentShaderCode(frag)));
}

void Grid::makeCrossShader() {
  static const char vert[] = R"(
    vec4 position(mat4 transformProjection, vec4 vertexPosition) {
      return transformProjection * vertexPosition;
    }
  )";
  static const char frag[] = R"(
    uniform float gridCellSize;
    uniform float gridSize;
    uniform float dotRadius;
    uniform vec2 offset;
    uniform vec2 viewOffset;

    vec4 effect(vec4 color, Image tex, vec2 texCoords, vec2 screenCoords) {
      vec2 f = mod(screenCoords + offset, gridCellSize);
      vec2 distToAxis = screenCoords - viewOffset;

      if (gridSize > 0.0 && (abs(distToAxis.x) > gridSize || abs(distToAxis.y) > gridSize)) {
        discard;
      }

      vec2 posTarget = 1.0 - step(dotRadius, f);
      vec2 negTarget = step(-dotRadius, f - gridCellSize);
      float target = min(posTarget.x, posTarget.y) + max(negTarget.x, negTarget.y);
      if (f.x <= 4.0 || f.y <= 4.0) {
        return vec4(color.rgb, target * color.a);
      } else {
        discard;
      }
    }
  )";
  shader.reset(
      lv.graphics.newShader(lv.wrapVertexShaderCode(vert), lv.wrapFragmentShaderCode(frag)));
}


//
// Draw
//

static float luaMod(float lhs, float rhs) {
  return rhs != 0 ? lhs - std::floor(lhs / rhs) * rhs : 0;
}

void Grid::draw(float gridCellSize, float gridSize, float viewScale, love::Vector2 view,
    love::Vector2 offset, float dotRadius, bool onlyAxes) const {
  if (gridCellSize > 0) {
    lv.graphics.push(love::Graphics::STACK_ALL);

    auto dpiScale = float(lv.graphics.getScreenDPIScale());

    // TODO: Factor into a uniform-setting util that also checks `->components` for safety, could be
    //       reused by belt shaders
    {
      auto info = shader->getUniformInfo("gridCellSize");
      info->floats[0] = dpiScale * gridCellSize * viewScale;
      shader->updateUniform(info, 1);
    }
    {
      auto info = shader->getUniformInfo("gridSize");
      info->floats[0] = dpiScale * gridSize * viewScale;
      shader->updateUniform(info, 1);
    }
    {
      auto info = shader->getUniformInfo("dotRadius");
      info->floats[0] = dpiScale * dotRadius;
      shader->updateUniform(info, 1);
    }
    {
      auto info = shader->getUniformInfo("offset");
      info->floats[0] = dpiScale * (luaMod(view.x, gridCellSize) - offset.x) * viewScale;
      info->floats[1] = dpiScale * (luaMod(view.y, gridCellSize) - offset.y) * viewScale;
      shader->updateUniform(info, 1);
    }
    {
      auto viewOffset = (offset - view) * dpiScale * viewScale;
      auto info = shader->getUniformInfo("viewOffset");
      info->floats[0] = viewOffset.x;
      info->floats[1] = viewOffset.y;
      shader->updateUniform(info, 1);
    }
    if (style == Style::Dot) {
      auto info = shader->getUniformInfo("onlyAxes");
      info->ints[0] = onlyAxes ? 1 : 0;
      shader->updateUniform(info, 1);
    }
    lv.graphics.setShader(shader.get());

    lv.graphics.origin();
    lv.graphics.rectangle(love::Graphics::DRAW_FILL, 0, 0, float(lv.graphics.getWidth()),
        float(lv.graphics.getHeight()));

    lv.graphics.pop();
  }
}
