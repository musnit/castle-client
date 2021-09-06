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

  handles.actorId = actorId;

  handles.drawRadius = 10 * scene.getPixelScale();

  // Body dimensions
  auto bounds = bodyBehavior.getEditorBounds(actorId);
  love::Vector2 boundsMin { bounds.minX(), bounds.minY() };
  love::Vector2 boundsMax { bounds.maxX(), bounds.maxY() };
  auto boundsSize = boundsMax - boundsMin;
  auto renderInfo = bodyBehavior.getRenderInfo(actorId);
  love::Vector2 scale { renderInfo.widthScale, renderInfo.heightScale };
  auto size = scale * boundsSize;
  auto center = scale * boundsMin + 0.5 * size;

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
        scaleHandle.pos
            = convert(body->GetWorldPoint(convert(center + 0.5 * love::Vector2 { i, j } * size)));
      }
    }
  }

  // Rotate handle
  auto minY = std::min(0.0f, renderInfo.heightScale * bounds.minY());
  handles.rotate.pos = convert(body->GetWorldPoint({ 0, minY - 8 * handles.drawRadius }));
  handles.rotate.pivot = convert(body->GetPosition());

  return handles;
}


//
// Update
//

struct ScaleMarker { // Marks touch as used for scale
  int handleIndex = 0;
};
struct RotateMarker {}; // Marks touch as used for rotation

void ScaleRotateTool::preUpdate(double dt) {
  if (!editor.hasScene()) {
    return;
  }
  auto &scene = editor.getScene();
  auto handles = getHandles();
  if (!handles) {
    return;
  }
  auto touchRadius = 30 * scene.getPixelScale();
  auto &gesture = scene.getGesture();
  gesture.withSingleTouch([&](TouchId touchId, const Touch &touch) {
    if (!touch.isUsed()) {
      auto closestScaleHandleSqDist = std::numeric_limits<float>::max();
      auto closestScaleHandleIndex = -1;

      auto scaleHandleIndex = 0;
      for (auto &scaleHandle : handles->scale) {
        auto scaleHandleSqDist = (scaleHandle.pos - touch.pos).getLengthSquare();
        if (scaleHandleSqDist < touchRadius * touchRadius
            && scaleHandleSqDist < closestScaleHandleSqDist) {
          closestScaleHandleSqDist = scaleHandleSqDist;
          closestScaleHandleIndex = scaleHandleIndex;
        }
        ++scaleHandleIndex;
      }

      auto &rotateHandle = handles->rotate;
      auto rotateHandleSqDist = (rotateHandle.pos - touch.pos).getLengthSquare();

      if (rotateHandleSqDist < touchRadius * touchRadius
          && rotateHandleSqDist < closestScaleHandleSqDist) {
        touch.use(scaleRotateTouchToken);
        gesture.setData<RotateMarker>(touchId);
      } else if (closestScaleHandleIndex != -1) {
        touch.use(scaleRotateTouchToken);
        gesture.setData<ScaleMarker>(touchId, closestScaleHandleIndex);
      }
    }
  });
}

void ScaleRotateTool::update(double dt) {
  if (!editor.hasScene()) {
    return;
  }
  auto &scene = editor.getScene();

  auto handles = getHandles();
  if (!handles) {
    return;
  }
  auto actorId = handles->actorId;

  auto &bodyBehavior = scene.getBehaviors().byType<BodyBehavior>();
  auto body = bodyBehavior.maybeGetPhysicsBody(actorId);
  if (!body) {
    return;
  }

  auto &gesture = scene.getGesture();
  gesture.withSingleTouch([&](TouchId touchId, const Touch &touch) {
    if (!touch.isUsed(scaleRotateTouchToken)) {
      return;
    }
    if (!touch.movedNear) {
      return;
    }

    if (auto scaleMarker = gesture.maybeGetData<ScaleMarker>(touchId)) { // Scale
      auto &scaleHandle = handles->scale[scaleMarker->handleIndex];

      auto localHandlePos = convert(body->GetLocalPoint(convert(scaleHandle.pos)));
      auto localOppositeHandlePos = -localHandlePos;
      auto localTouchPos = convert(body->GetLocalPoint(convert(touch.pos)));
      auto touchSize = localTouchPos - localOppositeHandlePos;
      touchSize.x = std::abs(touchSize.x);
      touchSize.y = std::abs(touchSize.y);
      if (props.gridEnabled()) {
        touchSize.x = Grid::quantize(touchSize.x, props.gridSize());
        touchSize.y = Grid::quantize(touchSize.y, props.gridSize());
      }
      touchSize.x = std::clamp(touchSize.x, BodyComponent::minBodySize, BodyComponent::maxBodySize);
      touchSize.y = std::clamp(touchSize.y, BodyComponent::minBodySize, BodyComponent::maxBodySize);

      auto bounds = bodyBehavior.getEditorBounds(actorId);
      love::Vector2 boundsMin { bounds.minX(), bounds.minY() };
      love::Vector2 boundsMax { bounds.maxX(), bounds.maxY() };
      auto boundsSize = boundsMax - boundsMin;
      auto renderInfo = bodyBehavior.getRenderInfo(actorId);
      love::Vector2 oldScale { renderInfo.widthScale, renderInfo.heightScale };
      auto size = oldScale * boundsSize;

      auto newSize = size;
      if (scaleHandle.type == ScaleHandle::Corner) {
        newSize = size * std::max(touchSize.x / size.x, touchSize.y / size.y);
      } else if (scaleHandle.type == ScaleHandle::Width) {
        newSize.x = touchSize.x;
      } else if (scaleHandle.type == ScaleHandle::Height) {
        newSize.y = touchSize.y;
      }

      auto scaleFactor = newSize / size;

      auto newScale = oldScale * scaleFactor;
      auto localNewPos = -localOppositeHandlePos * scaleFactor + localOppositeHandlePos;
      auto worldNewPos = convert(body->GetWorldPoint(convert(localNewPos)));
      auto worldOldPos = convert(body->GetPosition());
      Commands::Params commandParams;
      commandParams.coalesce = true;
      editor.getCommands().execute(
          "resize", commandParams,
          [actorId, worldNewPos, newScale](Editor &editor, bool) {
            auto &bodyBehavior = editor.getScene().getBehaviors().byType<BodyBehavior>();
            if (auto body = bodyBehavior.maybeGetPhysicsBody(actorId)) {
              bodyBehavior.setPosition(actorId, convert(worldNewPos));
              bodyBehavior.setScale(actorId, newScale.x, newScale.y);
            }
          },
          [actorId, worldOldPos, oldScale](Editor &editor, bool) {
            auto &bodyBehavior = editor.getScene().getBehaviors().byType<BodyBehavior>();
            if (auto body = bodyBehavior.maybeGetPhysicsBody(actorId)) {
              bodyBehavior.setPosition(actorId, convert(worldOldPos));
              bodyBehavior.setScale(actorId, oldScale.x, oldScale.y);
            }
          });
    } else if (gesture.hasData<RotateMarker>(touchId)) { // Rotate
      auto &rotateHandle = handles->rotate;
      auto angle = (touch.pos - rotateHandle.pivot).getAngle();
      auto prevAngle = (touch.pos - touch.delta - rotateHandle.pivot).getAngle();

      if (props.rotateIncrementEnabled()) {
        auto increment = float(props.rotateIncrementDegrees() * M_PI / 180);
        auto initialAngle = (touch.initialPos - rotateHandle.pivot).getAngle();
        angle = Grid::quantize(angle, increment, initialAngle);
        prevAngle = Grid::quantize(prevAngle, increment, initialAngle);
      }

      auto rotation = angle - prevAngle;
      auto oldBodyAngle = body->GetAngle();
      auto newBodyAngle = oldBodyAngle + rotation;
      Commands::Params commandParams;
      commandParams.coalesce = true;
      editor.getCommands().execute(
          "rotate", commandParams,
          [actorId, newBodyAngle](Editor &editor, bool) {
            auto &bodyBehavior = editor.getScene().getBehaviors().byType<BodyBehavior>();
            if (auto body = bodyBehavior.maybeGetPhysicsBody(actorId)) {
              bodyBehavior.setProperty(actorId, decltype(BodyComponent::Props::angle)::id,
                  newBodyAngle * 180 / M_PI, false);
            }
          },
          [actorId, oldBodyAngle](Editor &editor, bool) {
            auto &bodyBehavior = editor.getScene().getBehaviors().byType<BodyBehavior>();
            if (auto body = bodyBehavior.maybeGetPhysicsBody(actorId)) {
              bodyBehavior.setProperty(actorId, decltype(BodyComponent::Props::angle)::id,
                  oldBodyAngle * 180 / M_PI, false);
            }
          });
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

  if (auto handles = getHandles()) {
    lv.graphics.push(love::Graphics::STACK_ALL);
    lv.graphics.setColor({ 0, 1, 0, 0.8 });

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

    lv.graphics.pop();
  }
}
