#include "body.h"

#include "behaviors/all.h"


//
// Triggers
//

struct CollideTrigger : BaseTrigger {
  inline static const RuleRegistration<CollideTrigger, BodyBehavior> registration { "collide" };

  struct Params {
    PROP(Tag, tag);
  } params;

  inline static int nextId = 0;
  int id = nextId++; // Associates with `CollideTriggerMarker`
};

struct CollideTriggerMarker {
  // Added to an actor when a collision trigger is fired on it to track and prevent firing the same
  // trigger multiple times for the same other actor. All markers are removed after the physics step
  // so new collisions can be registered again.

  struct Entry {
    int triggerId; // Matches `CollideTrigger::id` for the trigger we're marking
    ActorId otherActorId;
  };
  SmallVector<Entry, 4> entries;
};

struct TapTrigger : BaseTrigger {
  inline static const RuleRegistration<TapTrigger, BodyBehavior> registration { "tap" };

  struct Params {
  } params;
};

struct PressTrigger : BaseTrigger {
  inline static const RuleRegistration<PressTrigger, BodyBehavior> registration { "press" };

  struct Params {
  } params;
};

struct TouchDownTrigger : BaseTrigger {
  inline static const RuleRegistration<TouchDownTrigger, BodyBehavior> registration {
    "touch down"
  };

  struct Params {
  } params;
};

struct TouchUpTrigger : BaseTrigger {
  inline static const RuleRegistration<TouchUpTrigger, BodyBehavior> registration { "touch up" };

  struct Params {
  } params;
};

struct EnterCameraViewportTrigger : BaseTrigger {
  inline static const RuleRegistration<EnterCameraViewportTrigger, BodyBehavior> registration {
    "enter camera viewport"
  };

  struct Params {
  } params;
};

struct ExitCameraViewportTrigger : BaseTrigger {
  inline static const RuleRegistration<ExitCameraViewportTrigger, BodyBehavior> registration {
    "exit camera viewport"
  };

  struct Params {
  } params;
};


//
// Responses
//

struct IsCollidingResponse : BaseResponse {
  inline static const RuleRegistration<IsCollidingResponse, BodyBehavior> registration {
    "is colliding"
  };

  struct Params {
    PROP(Tag, tag);
  } params;

  bool eval(RuleContext &ctx) override {
    auto &bodyBehavior = ctx.getScene().getBehaviors().byType<BodyBehavior>();
    auto &tagsBehavior = ctx.getScene().getBehaviors().byType<TagsBehavior>();
    if (auto body = bodyBehavior.maybeGetPhysicsBody(ctx.actorId)) {
      const auto tag = params.tag();
      for (auto contactEdge = body->GetContactList(); contactEdge;
           contactEdge = contactEdge->next) {
        if (auto contact = contactEdge->contact; contact->IsTouching()) {
          auto body1 = contactEdge->contact->GetFixtureA()->GetBody();
          auto body2 = contactEdge->contact->GetFixtureB()->GetBody();
          auto otherBody = body == body1 ? body2 : body1;
          if (tagsBehavior.hasTag(bodyBehavior.maybeGetActorId(otherBody), tag)) {
            return true;
          }
        }
      }
    }
    return false;
  }
};

struct FaceDirectionOfMotionResponse : BaseResponse {
  inline static const RuleRegistration<FaceDirectionOfMotionResponse, BodyBehavior> registration {
    "face direction of motion"
  };

  struct Params {
  } params;

  void run(RuleContext &ctx) override {
    auto &bodyBehavior = ctx.getScene().getBehaviors().byType<BodyBehavior>();
    if (auto body = bodyBehavior.maybeGetPhysicsBody(ctx.actorId)) {
      if (auto [vx, vy] = body->GetLinearVelocity(); !(vx == 0 && vy == 0)) {
        body->SetTransform(body->GetPosition(), std::atan2(vy, vx));
      }
    }
  }
};

struct IsInCameraViewportResponse : BaseResponse {
  inline static const RuleRegistration<IsInCameraViewportResponse, BodyBehavior> registration {
    "is in camera viewport"
  };

  struct Params {
  } params;

  bool eval(RuleContext &ctx) override {
    auto &bodyBehavior = ctx.getScene().getBehaviors().byType<BodyBehavior>();
    return bodyBehavior.viewportMarkerView.contains(ctx.actorId);
  }
};


//
// Camera layer
//

struct CameraLayerMarker {
  // Component that marks an actor as being in the camera layer (relative to camera). Used so we can
  // quickly query for such actors.
};


//
// Enable, disable
//

void BodyBehavior::handleEnableComponent(ActorId actorId, BodyComponent &component) {
  auto &scene = getScene();

  // Body
  b2BodyDef bodyDef;
  bodyDef.userData.pointer = entt::to_integral(actorId) + 1; // `actorId` can be 0, so offset
  bodyDef.type = b2_staticBody;
  bodyDef.position = { component.props.x(), component.props.y() };
  bodyDef.angle = component.props.angle();
  bodyDef.gravityScale = 0;
  component.body = scene.getPhysicsWorld().CreateBody(&bodyDef);

  // Layer
  switch (component.props.layerName()[0]) {
  case 'c': { // "camera"
    component.layer = BodyLayer::Camera;
    scene.getEntityRegistry().emplace<CameraLayerMarker>(actorId);
    break;
  }
  }

  // Fixtures
  recreateFixtures(actorId, component, false);
}

void BodyBehavior::handleDisableComponent(
    ActorId actorId, BodyComponent &component, bool removeActor) {
  if (component.body) {
    getScene().getPhysicsWorld().DestroyBody(component.body);
    component.body = nullptr;
  }
}


//
// Perform
//

void BodyBehavior::handlePerform(double dt) {
  auto &scene = getScene();
  auto &registry = scene.getEntityRegistry();
  auto &rulesBehavior = getBehaviors().byType<RulesBehavior>();

  // Clear collide trigger markers so new collide triggers can be fired
  registry.clear<CollideTriggerMarker>();

  // Touch hit tracking and triggers
  {
    auto &gesture = getGesture();
    auto currTime = lv.timer.getTime();
    gesture.forEachTouch([&](TouchId touchId, const Touch &touch) {
      auto &prevHits = getActorsAtTouch(touchId);
      ActorsAtTouch currHits;
      forEachActorAtPoint(touch.pos.x, touch.pos.y, [&](ActorId actorId, const b2Fixture *fixture) {
        if (std::find(currHits.begin(), currHits.end(), actorId) == currHits.end()) {
          currHits.push_back(actorId);
        }
        return true;
      });
      if (touch.released && !touch.movedFar && currTime - touch.pressTime < 0.3) {
        // Tap
        for (auto actorId : currHits) {
          if (rulesBehavior.fire<TapTrigger>(actorId, {})) {
            touch.forceUse(triggerTouchToken);
          }
        }
      }
      if (touch.released) {
        // Touch up
        for (auto actorId : currHits) {
          rulesBehavior.fire<TouchUpTrigger>(actorId, {});
        }
      } else {
        for (auto actorId : currHits) {
          if (touch.pressed
              || std::find(prevHits.begin(), prevHits.end(), actorId) == prevHits.end()) {
            // Pressed or moved onto actor -- touch down
            if (rulesBehavior.fire<TouchDownTrigger>(actorId, {})) {
              touch.forceUse(triggerTouchToken);
            }
          }
          // Currently on actor -- press
          if (rulesBehavior.fire<PressTrigger>(actorId, {})) {
            touch.forceUse(triggerTouchToken);
          }
        }
      }
      for (auto actorId : prevHits) {
        if (std::find(currHits.begin(), currHits.end(), actorId) == currHits.end()) {
          // Moved off actor -- touch up
          rulesBehavior.fire<TouchUpTrigger>(actorId, {});
        }
      }
      gesture.setData<ActorsAtTouch>(touchId, std::move(currHits));
    });
  }

  // Viewport containment tracking and triggers
  {
    ActorIdSet currHits;
    auto cameraPos = scene.getCameraPosition();
    auto cameraSize = scene.getCameraSize();
    auto min = cameraPos - cameraSize * 0.5;
    auto max = cameraPos + cameraSize * 0.5;
    forEachActorAtBoundingBox(
        min.x, min.y, max.x, max.y, [&](ActorId actorId, const b2Fixture *fixture) {
          if (!currHits.contains(actorId)) {
            currHits.emplace(actorId);
            if (!viewportMarkerView.contains(actorId)) {
              registry.emplace<ViewportMarker>(actorId);
              rulesBehavior.fire<EnterCameraViewportTrigger>(actorId, {});
            }
          }
          return true;
        });
    viewportMarkerView.each([&](ActorId actorId) {
      if (!currHits.contains(actorId)) {
        registry.remove<ViewportMarker>(actorId);
        rulesBehavior.fire<ExitCameraViewportTrigger>(actorId, {});
      }
    });
  }
}

void BodyBehavior::handlePerformCamera(float deltaX, float deltaY) {
  if (deltaX == 0 && deltaY == 0) {
    return;
  }
  auto delta = b2Vec2(deltaX, deltaY);
  getScene().getEntityRegistry().view<CameraLayerMarker, BodyComponent>().each(
      [&](ActorId actorId, BodyComponent &component) {
        if (auto body = component.body) {
          setPosition(actorId, component, body->GetPosition() + delta);
        }
      });
}


//
// Physics contact
//

void BodyBehavior::handleBeginPhysicsContact(b2Contact *contact) {
  // Get the actor ids involved
  auto body1 = contact->GetFixtureA()->GetBody();
  auto body2 = contact->GetFixtureB()->GetBody();
  auto actorId1 = maybeGetActorId(body1);
  auto actorId2 = maybeGetActorId(body2);

  // Fire triggers, using markers to deduplicate
  auto &registry = getScene().getEntityRegistry();
  auto &tagsBehavior = getBehaviors().byType<TagsBehavior>();
  auto &rulesBehavior = getBehaviors().byType<RulesBehavior>();
  const auto visit = [&](ActorId actorId, ActorId otherActorId) {
    RuleContextExtras extras;
    extras.otherActorId = otherActorId;
    rulesBehavior.fireIf<CollideTrigger>(actorId, extras, [&](const CollideTrigger &trigger) {
      auto tag = trigger.params.tag();
      if (!tagsBehavior.hasTag(otherActorId, tag)) {
        return false; // Tag didn't match
      }
      auto triggerId = trigger.id;
      auto &marker = registry.get_or_emplace<CollideTriggerMarker>(actorId);
      for (auto &entry : marker.entries) {
        if (entry.triggerId == triggerId && entry.otherActorId == otherActorId) {
          return false; // Already marked for this trigger and other actor
        }
      }
      marker.entries.push_back({ triggerId, otherActorId });
      return true;
    });
  };
  visit(actorId1, actorId2);
  visit(actorId2, actorId1);
}


//
// Getters, setters
//

ExpressionValue BodyBehavior::handleGetProperty(
    ActorId actorId, const BodyComponent &component, PropId propId) const {
  auto body = component.body;
  if (!body) {
    return {};
  }
  auto &props = component.props;
  if (propId == props.x.id) {
    auto result = body->GetPosition().x;
    if (component.layer == BodyLayer::Camera) {
      result -= getScene().getCameraPosition().x;
    }
    return result;
  } else if (propId == props.y.id) {
    auto result = body->GetPosition().y;
    if (component.layer == BodyLayer::Camera) {
      result -= getScene().getCameraPosition().y;
    }
    return result;
  } else if (propId == props.angle.id) {
    return body->GetAngle() * 180 / M_PI;
  } else if (propId == props.widthScale.id) {
    return 10 * props.widthScale();
  } else if (propId == props.heightScale.id) {
    return 10 * props.heightScale();
  } else {
    return BaseBehavior::handleGetProperty(actorId, component, propId);
  }
}

void BodyBehavior::handleSetProperty(
    ActorId actorId, BodyComponent &component, PropId propId, const ExpressionValue &value) {
  auto body = component.body;
  if (!body) {
    return;
  }
  auto &props = component.props;
  if (propId == props.x.id) {
    auto newX = value.as<float>();
    if (component.layer == BodyLayer::Camera) {
      newX += getScene().getCameraPosition().x;
    }
    body->SetTransform({ newX, body->GetPosition().y }, body->GetAngle());
  } else if (propId == props.y.id) {
    auto newY = value.as<float>();
    if (component.layer == BodyLayer::Camera) {
      newY += getScene().getCameraPosition().y;
    }
    body->SetTransform({ body->GetPosition().x, newY }, body->GetAngle());
  } else if (propId == props.angle.id) {
    body->SetTransform(body->GetPosition(), float(value.as<double>() * M_PI / 180));
  } else if (propId == props.widthScale.id) {
    props.widthScale() = value.as<float>() / 10;
    recreateFixtures(actorId, component, true); // PERF: Mark dirty and do this at end of frame?
  } else if (propId == props.heightScale.id) {
    props.heightScale() = value.as<float>() / 10;
    recreateFixtures(actorId, component, true); // PERF: Mark dirty and do this at end of frame?
  }
  BaseBehavior::handleSetProperty(actorId, component, propId, value);
}

void BodyBehavior::setPosition(ActorId actorId, b2Vec2 pos) {
  if (auto component = maybeGetComponent(actorId)) {
    setPosition(actorId, *component, pos);
  }
}

void BodyBehavior::setPosition(ActorId actorId, BodyComponent &component, b2Vec2 pos) {
  if (auto body = component.body) {
    body->SetTransform(pos, body->GetAngle());
    getBehaviors().forEach([&](auto &behavior) {
      if constexpr (Handlers::hasUpdateComponentPosition<decltype(behavior)>) {
        if (auto component = behavior.maybeGetComponent(actorId)) {
          behavior.handleUpdateComponentPosition(actorId, *component, body);
        }
      }
    });
  }
}


//
// Fixtures
//

void BodyBehavior::recreateFixtures(ActorId actorId, BodyComponent &component, bool notify) {
  auto body = component.body;
  if (!body) {
    return;
  }

  // Destroy current fixtures
  for (auto fixture = body->GetFixtureList(); fixture;) {
    auto next = fixture->GetNext();
    body->DestroyFixture(fixture);
    fixture = next;
  }

  // Create new fixtures
  auto widthScale = component.props.widthScale(), heightScale = component.props.heightScale();
  for (auto &fixture : component.props.fixtures()) {
    if (fixture.shapeType() == "circle") {
      if (abs(abs(widthScale) - abs(heightScale)) < 0.002) {
        // Uniformly-scaled circle
        b2CircleShape shape;
        shape.m_p = { widthScale * fixture.x(), heightScale * fixture.y() };
        shape.m_radius = widthScale * fixture.radius();
        addFixture(component, &shape);
      } else {
        // Non-uniformly scaled circle -- approximate with a polygon
        auto x = fixture.x(), y = fixture.y();
        auto radius = fixture.radius();
        std::array<b2Vec2, 8> points;
        auto angle = 0.0f;
        for (auto i = 0; i < 8; ++i) {
          auto dX = radius * cos(angle), dY = radius * sin(angle);
          points[i] = { widthScale * (x + dX), heightScale * (y + dY) };
          angle -= 2 * M_PI / 8;
        }
        b2PolygonShape shape;
        shape.Set(points.data(), 8);
        addFixture(component, &shape);
      }
    } else if (fixture.shapeType() == "polygon") {
      // Polygon with given points
      auto pointsProps = fixture.points();
      std::array<b2Vec2, 8> points;
      auto nPoints = std::min(int(pointsProps.size() / 2), 8);
      for (auto i = 0; i < nPoints; ++i) {
        points[i].x = widthScale * pointsProps[2 * i];
        points[i].y = heightScale * pointsProps[2 * i + 1];
      }
      b2PolygonShape shape;
      shape.Set(points.data(), nPoints);
      addFixture(component, &shape);
    }
  }

  // Notify behaviors that update fixtures
  if (notify) {
    getBehaviors().forEach([&](auto &behavior) {
      if constexpr (Handlers::hasUpdateComponentFixtures<decltype(behavior)>) {
        if (auto component = behavior.maybeGetComponent(actorId)) {
          behavior.handleUpdateComponentFixtures(actorId, *component, body);
        }
      }
    });
  }
}

b2Fixture *BodyBehavior::addFixture(BodyComponent &component, b2Shape *shape) {
  b2FixtureDef fixtureDef;

  // Defaults that other behaviors may override
  fixtureDef.isSensor = true;
  fixtureDef.friction = 0;
  fixtureDef.restitutionThreshold = 0.1; // Keeps bounciness on at lower speeds
  fixtureDef.density = 1;

  // Collision mask based on layer
  fixtureDef.filter.categoryBits = 1 << int(component.layer);
  fixtureDef.filter.maskBits = 1 << int(component.layer);

  fixtureDef.shape = shape;
  return component.body->CreateFixture(&fixtureDef);
}
