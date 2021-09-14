#include "physics_body_data.h"

std::string PhysicsBodyData::renderPreviewPng() {
  int size = 256;
  auto previewCanvas = love::DrawDataFrame::newCanvas(size, size);

  // TODO: we could find the bounds and scale this up to fit the canvas better
  love::DrawDataFrame::renderToCanvas(previewCanvas, [this, size]() {
    auto width = DRAW_MAX_SIZE * 2.0f;
    auto height = DRAW_MAX_SIZE * 2.0f;
    auto maxDimension = std::fmaxf(width, height);
    lv.graphics.push(love::Graphics::STACK_ALL);
    lv.graphics.origin();
    lv.graphics.scale(float(size) / maxDimension, float(size) / maxDimension);
    lv.graphics.clear(love::Colorf(1, 1, 1, 1), {}, {});
    lv.graphics.setColor({ 0, 0, 0, 1 });
    lv.graphics.translate(DRAW_MAX_SIZE, DRAW_MAX_SIZE);
    render();
    lv.graphics.pop();
  });
  auto result = love::DrawDataFrame::encodeBase64Png(previewCanvas);
  delete previewCanvas;
  return result;
}

void PhysicsBodyData::updatePreview() {
  base64Png = renderPreviewPng();
}

void PhysicsBodyData::makeShader() {
  static const char vert[] = R"(
    vec4 position(mat4 transformProjection, vec4 vertexPosition) {
      return transformProjection * vertexPosition;
    }
  )";
  static const char frag[] = R"(
    uniform float lineSpacing;
    uniform float lineRadius;

    vec4 effect(vec4 color, Image tex, vec2 texCoords, vec2 screenCoords) {
      float modxy = mod(screenCoords.x + screenCoords.y, lineSpacing);
      float diagonal = smoothstep(0.0, lineRadius, abs(modxy - lineRadius));
      return vec4(color.rgb, (1.0 - diagonal) * color.a);
    }
  )";
  shader.reset(
      lv.graphics.newShader(lv.wrapVertexShaderCode(vert), lv.wrapFragmentShaderCode(frag)));

  auto dpiScale = float(lv.graphics.getScreenDPIScale());
  {
    auto info = shader->getUniformInfo("lineSpacing");
    info->floats[0] = dpiScale * 24;
    shader->updateUniform(info, 1);
  }
  {
    auto info = shader->getUniformInfo("lineRadius");
    info->floats[0] = dpiScale * 6;
    shader->updateUniform(info, 1);
  }
}

void PhysicsBodyData::drawShape(PhysicsBodyDataShape &shape, love::Graphics::DrawMode mode) {
  if (shape.type == CollisionShapeType::Circle) {
    lv.graphics.circle(mode, shape.x, shape.y, shape.radius);
    return;
  }

  love::Vector2 p1 = shape.p1;
  love::Vector2 p2 = shape.p2;

  if (p1.x > p2.x) {
    love::Vector2 t = p2;
    p2 = p1;
    p1 = t;
  }

  if (shape.type == CollisionShapeType::Rectangle) {
    auto minX = p1.x;
    auto minY = std::fmin(p1.y, p2.y);
    lv.graphics.rectangle(mode, minX, minY, std::abs(p2.x - p1.x), std::abs(p2.y - p1.y));
  } else if (shape.type == CollisionShapeType::Triangle) {
    love::Vector2 coords[4];
    love::Vector2 p3 = shape.p3;
    bool isCounterclockwise = (p2.x - p1.x) * (p3.y - p1.y) - (p3.x - p1.x) * (p2.y - p1.y) > 0;
    if (isCounterclockwise) {
      coords[0] = { p1.x, p1.y };
      coords[1] = { p2.x, p2.y };
      coords[2] = { p3.x, p3.y };
      coords[3] = { p1.x, p1.y };
    } else {
      coords[0] = { p3.x, p3.y };
      coords[1] = { p2.x, p2.y };
      coords[2] = { p1.x, p1.y };
      coords[3] = { p3.x, p3.y };
    }
    lv.graphics.polygon(mode, coords, 4);
  }
}

void PhysicsBodyData::render() {
  if (!shader) {
    // build lazily because we never need to render in play mode
    makeShader();
  }

  lv.graphics.push(love::Graphics::STACK_ALL);

  // render diagonal line shaderfills of all shapes
  lv.graphics.setShader(shader.get());
  lv.graphics.translate(tempTranslateX, tempTranslateY);

  for (auto &shape : shapes) {
    drawShape(shape, love::Graphics::DRAW_FILL);
  }
  if (tempShape) {
    drawShape(*tempShape, love::Graphics::DRAW_FILL);
  }

  // render outlines, no shader
  lv.graphics.setShader();
  lv.graphics.setLineWidth(0.1);
  for (auto &shape : shapes) {
    drawShape(shape, love::Graphics::DRAW_LINE);
  }
  if (tempShape) {
    drawShape(*tempShape, love::Graphics::DRAW_LINE);
  }

  lv.graphics.pop();
}

std::vector<FixtureProps> PhysicsBodyData::getFixturesForBody() {
  std::vector<FixtureProps> result;

  for (auto &shape : shapes) {
    FixtureProps fixture;
    if (shape.type == CollisionShapeType::Circle) {
      fixture.shapeType() = "circle";
      fixture.x() = shape.x;
      fixture.y() = shape.y;
      fixture.radius() = shape.radius;
    } else {
      SmallVector<love::Vector2, 4> points;
      _pointsForShape(shape, points);
      for (size_t j = 0; j < points.size(); j++) {
        fixture.points().push_back(points[j].x);
        fixture.points().push_back(points[j].y);
      }
    }
    result.push_back(fixture);
  }

  return result;
}
