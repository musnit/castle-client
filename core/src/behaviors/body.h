#pragma once

#include "precomp.h"

#include "behaviors/base.h"
#include "props.h"


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
};

class BodyBehavior : public BaseBehavior<BodyBehavior, BodyComponent> {
public:
  static constexpr auto name = "Body";
  static constexpr auto behaviorId = 1;

  using BaseBehavior::BaseBehavior;


  void handleEnableComponent(ActorId actorId, BodyComponent &component);
  void handleDisableComponent(ActorId actorId, BodyComponent &component, bool removeActor);

  void handlePerform(double dt);

  void handleBeginPhysicsContact(b2Contact *contact);

  ExpressionValue handleGetProperty(
      ActorId actorId, const BodyComponent &component, PropId propId) const;
  void handleSetProperty(
      ActorId actorId, BodyComponent &component, PropId propId, const ExpressionValue &value);


  // `ActorId` <-> `b2Body` association

  b2Body *maybeGetPhysicsBody(ActorId actorId); // `nullptr` if not present
  const b2Body *maybeGetPhysicsBody(ActorId actorId) const; // `nullptr` if not present
  ActorId maybeGetActorId(const b2Body *body) const; // `nullActor` if not present


  // Rendering properties

  love::Vector2 getScale(ActorId actorId) const; // `{ 0, 0 }` if not present


  // Queries

  using QueryResult = SmallVector<ActorId, 8>; // A list of actors resulting from a query

  QueryResult getActorsAtBoundingBox(float minX, float minY, float maxX, float maxY) const;
  QueryResult getActorsAtPoint(float x, float y) const;

  // Prefer this for querying at touch. Results are cached at start of frame -- actors may have
  // moved or been destroyed since. Reference lives till end of frame, meant for immediate use.
  const QueryResult &getActorsAtTouch(TouchId touchId) const;


private:
  Lv &lv { Lv::getInstance() };


  struct ActorsAtTouch {
    // Extra data attached to touches that tracks the actors at the touch

    QueryResult result;
  };


  void recreateFixtures(BodyComponent &component);
  b2Fixture *addFixture(BodyComponent &component, b2Shape *shape);
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

inline love::Vector2 BodyBehavior::getScale(ActorId actorId) const {
  if (auto component = maybeGetComponent(actorId)) {
    return love::Vector2(component->props.widthScale(), component->props.heightScale());
  }
  return love::Vector2();
}

inline BodyBehavior::QueryResult BodyBehavior::getActorsAtBoundingBox(
    float minX, float minY, float maxX, float maxY) const {
  QueryResult result;
  struct Callback : b2QueryCallback {
    QueryResult &result;
    const BodyBehavior &bodyBehavior;

    Callback(QueryResult &result_, const BodyBehavior &bodyBehavior_)
        : result(result_)
        , bodyBehavior(bodyBehavior_) {
    }

    bool ReportFixture(b2Fixture *fixture) final {
      if (auto actorId = bodyBehavior.maybeGetActorId(fixture->GetBody()); actorId != nullActor) {
        if (std::find(result.begin(), result.end(), actorId) == result.end()) {
          result.push_back(actorId);
        }
      }
      return true;
    }
  } cb(result, *this);
  getScene().getPhysicsWorld().QueryAABB(&cb, { { minX, minY }, { maxX, maxY } });
  return result;
}

inline BodyBehavior::QueryResult BodyBehavior::getActorsAtPoint(float x, float y) const {
  QueryResult result;
  struct Callback : b2QueryCallback {
    QueryResult &result;
    const BodyBehavior &bodyBehavior;
    b2Vec2 point;

    Callback(QueryResult &result_, const BodyBehavior &bodyBehavior_, b2Vec2 point_)
        : result(result_)
        , bodyBehavior(bodyBehavior_)
        , point(point_) {
    }

    bool ReportFixture(b2Fixture *fixture) final {
      if (auto actorId = bodyBehavior.maybeGetActorId(fixture->GetBody()); actorId != nullActor) {
        if (std::find(result.begin(), result.end(), actorId) == result.end()) {
          if (fixture->TestPoint(point)) {
            result.push_back(actorId);
          }
        }
      }
      return true;
    }
  } cb(result, *this, { x, y });
  getScene().getPhysicsWorld().QueryAABB(
      &cb, { { x - 0.01f, y - 0.01f }, { x + 0.01f, y + 0.01f } });
  return result;
}

inline const BodyBehavior::QueryResult &BodyBehavior::getActorsAtTouch(TouchId touchId) const {
  if (auto actorsAtTouch = getGesture().maybeGetData<ActorsAtTouch>(touchId)) {
    return actorsAtTouch->result;
  } else {
    static QueryResult empty;
    return empty;
  }
}
