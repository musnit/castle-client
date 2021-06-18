#pragma once

#include "precomp.h"

#include "behaviors/base.h"
#include "props.h"


enum class BodyLayer {
  Main,
  Camera,
};

struct BodyComponent : BaseComponent {
  struct Props {
    PROP(float, x) = 0;
    PROP(float, y) = 0;
    PROP(float, angle) = 0;

    PROP(float, width) = 1;
    PROP(float, height) = 1;
    PROP(float, widthScale) = 0.1;
    PROP(float, heightScale) = 0.1;

    // NOTE: Skipping because it's never `true`
    // PROP(bool, bullet) = false;

    PROP(bool, visible) = true;

    // NOTE: Skipping because we start static and other behaviors (eg. `MovingBehavior`) set this
    // PROP(std::string, bodyType) = "static";

    // NOTE: Skipping because this is automatically calculated with `b2Body::ResetMassData()` after
    //       creating / updating fixtures
    // PROP((std::array<float, 4>), massData) = { 0.0f, 0.0f, 0.0f, 0.0f };

    PROP(std::string, layerName) = "main";

    struct FixtureProps {
      PROP(std::string, shapeType) = "polygon";
      PROP((SmallVector<float, 8>), points);
      PROP(float, x) = 0;
      PROP(float, y) = 0;
      PROP(float, radius) = 0;
    };
    PROP(std::vector<FixtureProps>, fixtures); // `std::vector` rather than `SmallVector` because we
                                               // rarely read this data at perform-time and it's big
  } props;

  b2Body *body = nullptr;
  BodyLayer layer = BodyLayer::Main;
};

class BodyBehavior : public BaseBehavior<BodyBehavior, BodyComponent> {
public:
  static constexpr auto name = "Body";
  static constexpr auto behaviorId = 1;
  static constexpr auto displayName = "Layout";

  using BaseBehavior::BaseBehavior;


  void handleEnableComponent(ActorId actorId, BodyComponent &component);
  void handleDisableComponent(ActorId actorId, BodyComponent &component, bool removeActor);

  void handlePerform(double dt);
  void handlePerformCamera(float deltaX, float deltaY);

  void handleBeginPhysicsContact(b2Contact *contact);

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


  // Information needed for rendering

  struct RenderInfo {
    bool visible = false;
    float widthScale = 1;
    float heightScale = 1;
  };
  RenderInfo getRenderInfo(ActorId actorId) const;


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


  // Viewport

  struct ViewportMarker {
    // Component that marks an actor as being currently in the camera viewport
  };
  entt::basic_view<entt::entity, entt::exclude_t<>, ViewportMarker> viewportMarkerView
      = getScene().getEntityRegistry().view<ViewportMarker>();
  friend struct IsInCameraViewportResponse;
};


// Inline implementations

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

template<typename F>
void BodyBehavior::forEachActorAtBoundingBox(
    float minX, float minY, float maxX, float maxY, F &&f) const {
  struct Callback : b2QueryCallback {
    const BodyBehavior &bodyBehavior;
    const F f;

    Callback(const BodyBehavior &bodyBehavior_, F &&f_)
        : bodyBehavior(bodyBehavior_)
        , f(std::forward<F>(f_)) {
    }

    bool ReportFixture(b2Fixture *fixture) final {
      if (auto actorId = bodyBehavior.maybeGetActorId(fixture->GetBody()); actorId != nullActor) {
        return f(actorId, (const b2Fixture *)fixture);
      }
      return true;
    }
  } cb(*this, std::forward<F>(f));
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
