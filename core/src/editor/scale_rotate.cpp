#include "scale_rotate.h"

#include "behaviors/all.h"
#include "editor.h"


inline static const TouchToken scaleRotateTouchToken;


//
// Constructor, destructor
//

ScaleRotateTool::ScaleRotateTool(Editor &editor_)
    : editor(editor_) {
}

void ScaleRotateTool::changeSettings(const std::string &action, double value) {
  if (action == "setGridEnabled") {
    props.gridEnabled() = bool(value);
  } else if (action == "setGridSize") {
    props.gridSize() = float(value);
  } else if (action == "setRotateIncrementEnabled") {
    props.rotateIncrementEnabled() = bool(value);
  } else if (action == "setRotateIncrementDegrees") {
    props.rotateIncrementDegrees() = float(value);
  }
}


//
// Handles
//

std::optional<ScaleRotateTool::Handles> ScaleRotateTool::getHandles() const {
  if (!editor.hasScene()) {
    return {};
  }
  auto &scene = editor.getScene();
  auto &selection = editor.getSelection();
  auto actorId = selection.firstSelectedActorId();
  if (actorId == nullActor) {
    return {};
  }

  auto &bodyBehavior = scene.getBehaviors().byType<BodyBehavior>();
  auto body = bodyBehavior.maybeGetPhysicsBody(actorId);
  if (!body) {
    return {};
  }

  Handles handles;

  handles.drawRadius = 10 * scene.getPixelScale();

  // Body dimensions
  auto bounds = bodyBehavior.getEditorBounds(actorId);
  love::Vector2 boundsMin { bounds.minX(), bounds.minY() };
  love::Vector2 boundsMax { bounds.maxX(), bounds.maxY() };
  auto size = boundsMax - boundsMin;
  auto center = boundsMin + 0.5 * size;
  auto renderInfo = bodyBehavior.getRenderInfo(actorId);
  love::Vector2 scale { renderInfo.widthScale, renderInfo.heightScale };
  auto scaledSize = scale * size;

  // Scale handles
  auto scaleHandleI = 0;
  for (float i = -1; i <= 1; ++i) {
    for (float j = -1; j <= 1; ++j) {
      if (scaleHandleI < int(handles.scale.size()) && !(i == 0 && j == 0)) {
        auto &scaleHandle = handles.scale[scaleHandleI++];
        if (i != 0 && j != 0) {
          scaleHandle.type = ScaleHandle::Corner;
        } else if (i != 0 && j == 0) {
          scaleHandle.type = ScaleHandle::Width;
        } else if (i == 0 && j != 0) {
          scaleHandle.type = ScaleHandle::Height;
        }
        scaleHandle.pos = convert(
            body->GetWorldPoint(convert(center + 0.5 * love::Vector2 { i, j } * scaledSize)));
      }
    }
  }

  // Rotate handle
  auto rotateHandleY = std::max(0.0f, bounds.minY()) - 8 * handles.drawRadius;
  handles.rotate.pos = convert(body->GetWorldPoint({ 0, rotateHandleY }));
  handles.rotate.pivot = convert(body->GetPosition());

  return handles;
}


//
// Update
//

void ScaleRotateTool::update(double dt) {
  if (!editor.hasScene()) {
    return;
  }
  auto &scene = editor.getScene();
  auto &selection = editor.getSelection();

  if (!selection.hasSelection()) {
    return;
  }

  scene.getGesture().withSingleTouch([&](const Touch &touch) {
    auto fromBelt = touch.isUsed(Belt::placedTouchToken);
    if (!touch.isUsed(scaleRotateTouchToken) && !fromBelt) {
      // Not used by us yet, let's see if we can use it
      if (touch.isUsed() && !touch.isUsed(Selection::touchToken)) {
        return; // Bail if used by anything other than selection
      }
      if (!touch.movedNear) {
        return; // Need to move at least a bit
      }
      touch.forceUse(scaleRotateTouchToken);
    }
  });
}


//
// Draw
//

void ScaleRotateTool::drawOverlay() const {
  if (!editor.hasScene()) {
    return;
  }
  auto &scene = editor.getScene();

  auto gridSize = props.gridSize();
  if (props.gridEnabled() && gridSize > 0) {
    lv.graphics.setColor({ 0, 0, 0, 0.5 });
    editor.getGrid().draw(gridSize, -1, scene.getViewScale(), scene.getCameraPosition(),
        { 0.5f * scene.getCameraSize().x, scene.getViewYOffset() }, 2, false);
  }

  lv.graphics.push(love::Graphics::STACK_ALL);
  lv.graphics.setColor({ 0, 1, 0, 0.8 });

  if (auto handles = getHandles()) {
    // Scale handles
    for (auto &scaleHandle : handles->scale) {
      lv.graphics.circle(
          love::Graphics::DRAW_FILL, scaleHandle.pos.x, scaleHandle.pos.y, handles->drawRadius);
    }

    // Rotate handle
    {
      auto &rotateHandle = handles->rotate;

      auto zoom = scene.getCameraZoom();
      auto centerCircleRadius = 0.3f * zoom;
      auto delta = rotateHandle.pivot - rotateHandle.pos;
      auto length = delta.getLength();
      auto dir = delta / length;

      std::array line { rotateHandle.pos, rotateHandle.pos + (length - centerCircleRadius) * dir };
      lv.graphics.polyline(line.data(), line.size());
      lv.graphics.circle(love::Graphics::DRAW_LINE, rotateHandle.pivot.x, rotateHandle.pivot.y,
          centerCircleRadius);

      auto arcRadius = 1.0f * zoom;
      auto arcAngle = 0.7f;
      auto arcCenter = rotateHandle.pos + arcRadius * dir;
      auto angle = std::atan2(-dir.y, -dir.x);
      lv.graphics.arc(love::Graphics::DRAW_LINE, love::Graphics::ARC_OPEN, arcCenter.x, arcCenter.y,
          arcRadius, angle - arcAngle, angle + arcAngle, 10);

      auto arrowAngle = 0.15f;
      auto arrowRadius = 0.15f * zoom;
      const auto drawArrowLine = [&](float endRadius, float startAngle, float endAngle) {
        std::array line {
          arcCenter + arcRadius * love::Vector2 { std::cos(startAngle), std::sin(startAngle) },
          arcCenter + endRadius * love::Vector2 { std::cos(endAngle), std::sin(endAngle) },
        };
        lv.graphics.polyline(line.data(), line.size());
      };
      drawArrowLine(arcRadius + arrowRadius, angle + arcAngle, angle + arcAngle - arrowAngle);
      drawArrowLine(arcRadius - arrowRadius, angle + arcAngle, angle + arcAngle - arrowAngle);
      drawArrowLine(arcRadius + arrowRadius, angle - arcAngle, angle - arcAngle + arrowAngle);
      drawArrowLine(arcRadius - arrowRadius, angle - arcAngle, angle - arcAngle + arrowAngle);
    }
  }

  lv.graphics.pop();
}
