#pragma once

#include "precomp.h"

#include "behaviors/base.h"
#include "props.h"
#include "editor/draw/physics_body_data.h"


love::Vector2 convert(b2Vec2 v);
b2Vec2 convert(love::Vector2 v);


enum class BodyLayer {
  Main,
  Camera,
};

struct ScaledEditorBounds {
  float minX;
  float maxX;
  float minY;
  float maxY;
  float centerX;
  float centerY;
  float width;
  float height;
};

struct BodyComponent : BaseComponent {
  static constexpr float minBodySize = 0.25;
  static constexpr float maxBodySize = 40;
  static constexpr float minBodyScale = -maxBodySize;
  static constexpr float maxBodyScale = maxBodySize;

  struct Props {
    PROP(float, x, .label("X Position")) = 0;
    PROP(float, y, .label("Y Position")) = 0;
    PROP(float, angle, .label("Rotation")) = 0;

    PROP(
         float, width,
         .label("Width")
         .min(minBodySize)
         .max(maxBodySize)
         .rulesGet(false)
         .rulesSet(false)
         ) = 1;
    PROP(
         float, height,
         .label("Height")
         .min(minBodySize)
         .max(maxBodySize)
         .rulesGet(false)
         .rulesSet(false)
         ) = 1;
    PROP(
         float, widthScale,
         .min(minBodyScale)
         .max(maxBodyScale)
         .label("Width Scale")
         ) = 0.1;
    PROP(
         float, heightScale,
         .min(minBodyScale)
         .max(maxBodyScale)
         .label("Height Scale")
         ) = 0.1;

    // NOTE: Skipping because it's never `true`
    // PROP(bool, bullet) = false;

    PROP(
         bool, visible,
         .label("Visible")
         .rulesGet(false)
         ) = true;

    // NOTE: Skipping because we start static and other behaviors (eg. `MovingBehavior`) set this
    // PROP(std::string, bodyType) = "static";

    // NOTE: Skipping because this is automatically calculated with `b2Body::ResetMassData()` after
    //       creating / updating fixtures
    // PROP((std::array<float, 4>), massData) = { 0.0f, 0.0f, 0.0f, 0.0f };

    PROP(
         bool, relativeToCamera,
         .rulesGet(false)
         .rulesSet(false)
         ) = false;

    PROP(
         std::string, layerName,
         .rulesGet(false)
         .rulesSet(false)
         ) = "main";

    PROP(
         std::vector<FixtureProps>, fixtures, // `std::vector` rather than `SmallVector` because we
                                              // rarely read this data at perform-time and it's big
         .rulesGet(false)
         .rulesSet(false)
         );

    struct EditorBounds {
      PROP(float, minX);
      PROP(float, maxX);
      PROP(float, minY);
      PROP(float, maxY);
    };
    PROP(EditorBounds, editorBounds, .rulesGet(false) .rulesSet(false));
  } props;

  b2Body *body = nullptr;
  BodyLayer layer = BodyLayer::Main;
};

class BodyBehavior : public BaseBehavior<BodyBehavior, BodyComponent> {
public:
  static constexpr auto name = "Body";
  static constexpr auto behaviorId = 1;
  static constexpr auto displayName = "Layout";
  static constexpr auto allowsDisableWithoutRemoval = false;

  using BaseBehavior::BaseBehavior;


  void handleEnableComponent(ActorId actorId, BodyComponent &component);
  void handleDisableComponent(ActorId actorId, BodyComponent &component, bool removeActor);

  void handlePerform(double dt);
  void handlePerformCamera(float deltaX, float deltaY);

  void handleBeginPhysicsContact(b2Contact *contact);
  void handleEndPhysicsContact(b2Contact *contact);

  ExpressionValue handleGetProperty(
      ActorId actorId, const BodyComponent &component, PropId propId) const;
  void handleSetProperty(
      ActorId actorId, BodyComponent &component, PropId propId, const ExpressionValue &value);


  // `ActorId` <-> `b2Body` association

  b2Body *maybeGetPhysicsBody(ActorId actorId); // `nullptr` if not present
  const b2Body *maybeGetPhysicsBody(ActorId actorId) const; // `nullptr` if not present
  ActorId maybeGetActorId(const b2Body *body) const; // `nullActor` if not present


  // Transform

  void setPosition(ActorId actorId, b2Vec2 pos); // Use this instead of `SetTransform` when setting
                                                 // body position -- notifies other behaviors
  void setScale(ActorId actorId, float widthScale, float heightScale);

  // Fixtures
  void setFixturesFromDrawing(ActorId actorId, std::vector<FixtureProps> fixtures);
  ScaledEditorBounds getScaledEditorBounds(
      ActorId actorId, BodyComponent &component, bool enforceMinimumSize);


  // Information needed for rendering

  struct RenderInfo {
    bool visible = false;
    float widthScale = 1;
    float heightScale = 1;
  };
  RenderInfo getRenderInfo(ActorId actorId) const;
  BodyComponent::Props::EditorBounds getEditorBounds(ActorId actorId) const;


  // Queries

  // These queries repeat actors if they have multiple fixtures that match the query
  template<typename F> // `F` takes `(ActorId, const b2Fixture *)`, returns `false` to stop query
  void forEachActorAtBoundingBox(float minX, float minY, float maxX, float maxY, F &&f) const;
  template<typename F>
  void forEachActorAtPoint(float x, float y, F &&f) const;

  // Prefer this for querying at touch. Results are cached at start of frame -- actors may have
  // moved or been destroyed since. Reference lives till end of frame, meant for immediate use.
  // Doesn't repeat actors.
  using ActorsAtTouch = SmallVector<ActorId, 8>;
  const ActorsAtTouch &getActorsAtTouch(TouchId touchId) const;


  inline static const TouchToken triggerTouchToken; // Marks as used by touch triggers


private:
  Lv &lv { Lv::getInstance() };


  // Transform

  void setPosition(ActorId actorId, BodyComponent &component, b2Vec2 pos);


  // Fixtures

  void recreateFixtures(ActorId actorId, BodyComponent &component, bool notify);
  b2Fixture *addFixture(BodyComponent &component, b2Shape *shape);
  static bool isDegeneratePoly(const b2Vec2 *vertices, int32 count);

  // Viewport

  struct ViewportMarker {
    // Component that marks an actor as being currently in the camera viewport
  };
  entt::basic_view<entt::entity, entt::exclude_t<>, ViewportMarker> viewportMarkerView
      = getScene().getEntityRegistry().view<ViewportMarker>();
  friend struct IsInCameraViewportResponse;
};


// Inline implementations

inline love::Vector2 convert(b2Vec2 v) {
  return { v.x, v.y };
}

inline b2Vec2 convert(love::Vector2 v) {
  return { v.x, v.y };
}

inline b2Body *BodyBehavior::maybeGetPhysicsBody(ActorId actorId) {
  if (auto component = maybeGetComponent(actorId)) {
    return component->body;
  }
  return nullptr;
}

inline const b2Body *BodyBehavior::maybeGetPhysicsBody(ActorId actorId) const {
  if (auto component = maybeGetComponent(actorId)) {
    return component->body;
  }
  return nullptr;
}

inline ActorId BodyBehavior::maybeGetActorId(const b2Body *body) const {
  auto actorId = ActorId(const_cast<b2Body *>(body)->GetUserData().pointer - 1);
  return hasComponent(actorId) ? actorId : nullActor;
}

inline BodyBehavior::RenderInfo BodyBehavior::getRenderInfo(ActorId actorId) const {
  if (auto component = maybeGetComponent(actorId)) {
    return {
      component->props.visible(),
      component->props.widthScale(),
      component->props.heightScale(),
    };
  } else {
    return {};
  }
}

inline BodyComponent::Props::EditorBounds BodyBehavior::getEditorBounds(ActorId actorId) const {
  if (auto component = maybeGetComponent(actorId)) {
    return component->props.editorBounds();
  } else {
    return {};
  }
}

template<typename F>
void BodyBehavior::forEachActorAtBoundingBox(
    float minX, float minY, float maxX, float maxY, F &&f) const {
  struct Callback : b2QueryCallback {
    const Scene &scene;
    const BodyBehavior &bodyBehavior;
    const F f;

    Callback(const Scene &scene_, const BodyBehavior &bodyBehavior_, F &&f_)
        : scene(scene_)
        , bodyBehavior(bodyBehavior_)
        , f(std::forward<F>(f_)) {
    }

    bool ReportFixture(b2Fixture *fixture) final {
      if (auto actorId = bodyBehavior.maybeGetActorId(fixture->GetBody());
          actorId != nullActor && !scene.isGhost(actorId)) {
        return f(actorId, (const b2Fixture *)fixture);
      }
      return true;
    }
  } cb(getScene(), *this, std::forward<F>(f));
  getScene().getPhysicsWorld().QueryAABB(&cb, { { minX, minY }, { maxX, maxY } });
}

template<typename F>
void BodyBehavior::forEachActorAtPoint(float x, float y, F &&f) const {
  forEachActorAtBoundingBox(
      x - 0.01, y - 0.01, x + 0.01, y + 0.01, [&](ActorId actorId, const b2Fixture *fixture) {
        if (fixture->TestPoint({ x, y })) {
          return f(actorId, fixture);
        }
        return true;
      });
}

inline const BodyBehavior::ActorsAtTouch &BodyBehavior::getActorsAtTouch(TouchId touchId) const {
  if (auto actorsAtTouch = getGesture().maybeGetData<ActorsAtTouch>(touchId)) {
    return *actorsAtTouch;
  } else {
    static ActorsAtTouch empty;
    return empty;
  }
}
