#include "body.h"

#include "behaviors/all.h"

#define EDITOR_BOUNDS_MIN_SIZE 0.5
#define MINIMUM_SCALE 0.001


//
// Triggers
//

struct CollideTrigger : BaseTrigger {
  inline static const RuleRegistration<CollideTrigger, BodyBehavior> registration { "collide" };
  static constexpr auto description = "When this collides with another actor";

  struct Params {
    PROP(Tag, tag, .label("collides with tag"));
  } params;

  inline static int nextId = 0;
  int id = nextId++; // Associates with `CollideTriggerMarker`
};

struct TapTrigger : BaseTrigger {
  inline static const RuleRegistration<TapTrigger, BodyBehavior> registration { "tap" };
  static constexpr auto description = "When this is tapped";

  struct Params {
  } params;
};

struct PressTrigger : BaseTrigger {
  inline static const RuleRegistration<PressTrigger, BodyBehavior> registration { "press" };
  static constexpr auto description = "While this is pressed";

  struct Params {
  } params;
};

struct TouchDownTrigger : BaseTrigger {
  inline static const RuleRegistration<TouchDownTrigger, BodyBehavior> registration {
    "touch down"
  };
  static constexpr auto description = "When a touch begins on this";

  struct Params {
  } params;
};

struct TouchUpTrigger : BaseTrigger {
  inline static const RuleRegistration<TouchUpTrigger, BodyBehavior> registration { "touch up" };
  static constexpr auto description = "When a touch ends on this";

  struct Params {
  } params;
};

struct EnterCameraViewportTrigger : BaseTrigger {
  inline static const RuleRegistration<EnterCameraViewportTrigger, BodyBehavior> registration {
    "enter camera viewport"
  };
  static constexpr auto description = "When this enters the camera viewport";

  struct Params {
  } params;
};

struct ExitCameraViewportTrigger : BaseTrigger {
  inline static const RuleRegistration<ExitCameraViewportTrigger, BodyBehavior> registration {
    "exit camera viewport"
  };
  static constexpr auto description = "When this exits the camera viewport";

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
  static constexpr auto description = "If this is colliding";

  struct Params {
    PROP(Tag, tag, .label("colliding with tag"));
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
  static constexpr auto description = "Face direction of motion";

  struct Params {
    PROP(ExpressionRef, lerp, .label("lerp") .min(0) .max(1)) = 1;
  } params;

  void run(RuleContext &ctx) override {
    auto &bodyBehavior = ctx.getScene().getBehaviors().byType<BodyBehavior>();
    if (auto body = bodyBehavior.maybeGetPhysicsBody(ctx.actorId)) {
      if (auto [vx, vy] = body->GetLinearVelocity(); !(vx == 0 && vy == 0)) {
        auto lerp = params.lerp().eval<double>(ctx);
        auto initialAngle = body->GetAngle();
        auto finalAngle = std::atan2(vy, vx);
        constexpr auto twoPi = 2 * M_PI;
        auto dAngle = finalAngle - initialAngle + M_PI;
        dAngle = dAngle - std::floor(dAngle / twoPi) * twoPi - M_PI;
        body->SetTransform(body->GetPosition(), initialAngle + dAngle * lerp);
      }
    }
  }
};

struct IsInCameraViewportResponse : BaseResponse {
  inline static const RuleRegistration<IsInCameraViewportResponse, BodyBehavior> registration {
    "is in camera viewport"
  };
  static constexpr auto description = "If this is in the camera viewport";

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
    component.props.relativeToCamera() = true;
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

  // Collision triggers where neither actor is dynamic (Box2D doesn't fire contact events for them)
  {
    auto &tagsBehavior = getBehaviors().byType<TagsBehavior>();

    struct NonDynamicCollideTriggerMarker {
      // Marks a trigger as having been fired for an <actor, trigger, other actor> combination.
      // Neither actor has a dynamic body. The trigger is fired only when an entry is newly added.
      // Prevents over-firing triggers.

      struct Entry {
        int triggerId = -1; // Matches `CollideTrigger::id` for the trigger we're marking
        ActorId otherActorId = nullActor;
        bool active = true;
      };
      SmallVector<Entry, 4> entries;
    };

    // Set leftover markers as inactive -- they'll be updated to active if visited below
    registry.view<NonDynamicCollideTriggerMarker>().each(
        [&](NonDynamicCollideTriggerMarker &marker) {
          for (auto &entry : marker.entries) {
            entry.active = false;
          }
        });

    // Find and fire relevant triggers, updating active-ness of markers too
    rulesBehavior.fireAllIf<CollideTrigger, BodyComponent>(
        {}, [&](ActorId actorId, const CollideTrigger &trigger, const BodyComponent &component) {
          // Returning `false` from this since we just use it to find triggers -- we'll actually do
          // the triggering with `fireIf` inside the spatial query
          auto body = component.body;
          if (!body || body->GetType() == b2_dynamicBody) {
            return false;
          }
          auto &tag = trigger.params.tag();
          for (auto fixture = body->GetFixtureList(); fixture; fixture = fixture->GetNext()) {
            auto bb = fixture->GetAABB(0);
            auto shape = fixture->GetShape();
            forEachActorAtBoundingBox(bb.lowerBound.x, bb.lowerBound.y, bb.upperBound.x,
                bb.upperBound.y, [&](ActorId otherActorId, const b2Fixture *otherFixture) {
                  // Returning `true` here always because we need to visit all possible collisions
                  if (actorId == otherActorId) {
                    return true;
                  }
                  auto otherBody = otherFixture->GetBody();
                  if (otherBody->GetType() == b2_dynamicBody) {
                    return true;
                  }
                  if (!tagsBehavior.hasTag(otherActorId, tag)) {
                    return true;
                  }
                  auto otherShape = otherFixture->GetShape();
                  if (!b2TestOverlap(shape, 0, otherShape, 0, body->GetTransform(),
                          otherBody->GetTransform())) {
                    return true;
                  }
                  auto triggerId = trigger.id;
                  auto &marker = registry.get_or_emplace<NonDynamicCollideTriggerMarker>(actorId);
                  for (auto &entry : marker.entries) {
                    if (entry.triggerId == triggerId && entry.otherActorId == otherActorId) {
                      // Already marked for trigger and other actor -- set as active, don't fire
                      entry.active = true;
                      return true;
                    }
                  }
                  marker.entries.push_back({ triggerId, otherActorId }); // Not marked yet -- fire!
                  RuleContextExtras extras;
                  extras.otherActorId = otherActorId;
                  rulesBehavior.fireIf<CollideTrigger>(
                      actorId, extras, [&](const CollideTrigger &candidateTrigger) {
                        return candidateTrigger.id == triggerId;
                      });
                  return true;
                });
          }
          return false;
        });

    // Remove markers that are still not active
    registry.view<NonDynamicCollideTriggerMarker>().each(
        [&](ActorId actorId, NonDynamicCollideTriggerMarker &marker) {
          auto removeIfResult = std::remove_if(marker.entries.begin(), marker.entries.end(),
              [&](NonDynamicCollideTriggerMarker::Entry &entry) {
                return !entry.active;
              });
          marker.entries.erase(removeIfResult, marker.entries.end());
          if (marker.entries.empty()) {
            registry.remove<NonDynamicCollideTriggerMarker>(actorId);
          }
        });

    // Debug-display markers
    constexpr auto debugDisplay = false;
    if constexpr (debugDisplay) {
      registry.view<NonDynamicCollideTriggerMarker>().each(
          [&](ActorId actorId, NonDynamicCollideTriggerMarker &marker) {
            for (auto &entry : marker.entries) {
              Debug::display("actors {} and {}", actorId, entry.otherActorId);
            }
          });
    }
  }

  // Touch hit tracking and triggers
  {
    auto &gesture = getGesture();
    auto currTime = lv.timer.getTime();
    gesture.forEachTouch([&](TouchId touchId, const Touch &touch) {
      if (touch.isUsed(TextBehavior::overlayTouchToken)
          || touch.isUsed(TextBehavior::leaderboardTouchToken)) {
        return;
      }
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

struct DynamicCollideTriggerMarker {
  // Counts the number of physics contacts currently relevant to an <actor, trigger, other actor>
  // combination. At least one of the actors has a dynamic body (Box2D doesn't generate contacts
  // otherwise). The trigger is fired only when the contact count goes from 0 to 1. Prevents
  // over-firing triggers when actors have multiple collision shapes.

  struct Entry {
    int triggerId = -1; // Matches `CollideTrigger::id` for the trigger we're marking
    ActorId otherActorId = nullActor;
    int contactCount = 0;
  };
  SmallVector<Entry, 4> entries;
};

void BodyBehavior::handleBeginPhysicsContact(b2Contact *contact) {
  auto body1 = contact->GetFixtureA()->GetBody();
  auto body2 = contact->GetFixtureB()->GetBody();
  auto actorId1 = maybeGetActorId(body1);
  auto actorId2 = maybeGetActorId(body2);

  auto &registry = getScene().getEntityRegistry();
  auto &tagsBehavior = getBehaviors().byType<TagsBehavior>();
  auto &rulesBehavior = getBehaviors().byType<RulesBehavior>();

  // Fire begin triggers
  const auto visit = [&](ActorId actorId, ActorId otherActorId) {
    RuleContextExtras extras;
    extras.otherActorId = otherActorId;
    rulesBehavior.fireIf<CollideTrigger>(actorId, extras, [&](const CollideTrigger &trigger) {
      if (!tagsBehavior.hasTag(otherActorId, trigger.params.tag())) {
        return false; // Tag didn't match
      }
      auto triggerId = trigger.id;
      auto &marker = registry.get_or_emplace<DynamicCollideTriggerMarker>(actorId);
      for (auto &entry : marker.entries) {
        if (entry.triggerId == triggerId && entry.otherActorId == otherActorId) {
          // Already have an entry for this trigger and other actor -- increment count, don't fire
          ++entry.contactCount;
          return false;
        }
      }
      marker.entries.push_back({ triggerId, otherActorId, 1 }); // First contact -- fire
      return true;
    });
  };
  visit(actorId1, actorId2);
  visit(actorId2, actorId1);
}

void BodyBehavior::handleEndPhysicsContact(b2Contact *contact) {
  auto body1 = contact->GetFixtureA()->GetBody();
  auto body2 = contact->GetFixtureB()->GetBody();
  auto actorId1 = maybeGetActorId(body1);
  auto actorId2 = maybeGetActorId(body2);

  auto &registry = getScene().getEntityRegistry();
  auto &tagsBehavior = getBehaviors().byType<TagsBehavior>();
  auto &rulesBehavior = getBehaviors().byType<RulesBehavior>();

  // Decrement count for begin triggers -- we use `fireIf` but always return `false`, just as a way
  // to iterate triggers...
  const auto visit = [&](ActorId actorId, ActorId otherActorId) {
    rulesBehavior.fireIf<CollideTrigger>(actorId, {}, [&](const CollideTrigger &trigger) {
      if (!tagsBehavior.hasTag(otherActorId, trigger.params.tag())) {
        return false; // Tag didn't match
      }
      auto triggerId = trigger.id;
      if (registry.has<DynamicCollideTriggerMarker>(actorId)) {
        auto &marker = registry.get<DynamicCollideTriggerMarker>(actorId);
        auto removeIfResult = std::remove_if(marker.entries.begin(), marker.entries.end(),
            [&](DynamicCollideTriggerMarker::Entry &entry) {
              if (entry.triggerId == triggerId && entry.otherActorId == otherActorId) {
                --entry.contactCount;
              }
              return entry.contactCount <= 0;
            });
        marker.entries.erase(removeIfResult, marker.entries.end());
        if (marker.entries.empty()) {
          registry.remove<DynamicCollideTriggerMarker>(actorId);
        }
      }
      return false;
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
    props.x() = newX;
    if (component.layer == BodyLayer::Camera) {
      newX += getScene().getCameraPosition().x;
    }
    body->SetTransform({ newX, body->GetPosition().y }, body->GetAngle());
  } else if (propId == props.y.id) {
    auto newY = value.as<float>();
    props.y() = newY;
    if (component.layer == BodyLayer::Camera) {
      newY += getScene().getCameraPosition().y;
    }
    body->SetTransform({ body->GetPosition().x, newY }, body->GetAngle());
  } else if (propId == props.angle.id) {
    props.angle() = float(value.as<double>() * M_PI / 180);
    body->SetTransform(body->GetPosition(), props.angle());
  } else if (propId == props.widthScale.id) {
    props.widthScale() = value.as<float>() / 10;
    recreateFixtures(actorId, component, true); // PERF: Mark dirty and do this at end of frame?
  } else if (propId == props.heightScale.id) {
    props.heightScale() = value.as<float>() / 10;
    recreateFixtures(actorId, component, true); // PERF: Mark dirty and do this at end of frame?
  } else if (propId == props.relativeToCamera.id) {
    if (value.as<bool>()) {
      props.relativeToCamera() = true;
      props.layerName() = "camera";
      component.layer = BodyLayer::Camera;
      getScene().getEntityRegistry().emplace_or_replace<CameraLayerMarker>(actorId);
    } else {
      props.relativeToCamera() = false;
      props.layerName() = "main";
      component.layer = BodyLayer::Main;
      getScene().getEntityRegistry().remove_if_exists<CameraLayerMarker>(actorId);
    }
  } else {
    BaseBehavior::handleSetProperty(actorId, component, propId, value);
  }
}

void BodyBehavior::setPosition(ActorId actorId, b2Vec2 pos) {
  if (auto component = maybeGetComponent(actorId)) {
    setPosition(actorId, *component, pos);
  }
}

void BodyBehavior::setPosition(ActorId actorId, BodyComponent &component, b2Vec2 pos) {
  component.props.x() = pos.x;
  component.props.y() = pos.y;
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

void BodyBehavior::setScale(ActorId actorId, float widthScale, float heightScale) {
  if (auto component = maybeGetComponent(actorId)) {
    component->props.widthScale() = widthScale;
    component->props.heightScale() = heightScale;
    recreateFixtures(actorId, *component, true);
  }
}


//
// Fixtures
//

// copied from `b2PolygonShape::Set` so we can avoid creating degenerate polygons
// instead of hitting the internal box2d assert and silently failing.
bool BodyBehavior::isDegeneratePoly(const b2Vec2 *vertices, int32 count) {
  int32 n = b2Min(count, b2_maxPolygonVertices);

  b2Vec2 ps[b2_maxPolygonVertices];
  int32 tempCount = 0;
  for (int32 i = 0; i < n; ++i) {
    b2Vec2 v = vertices[i];

    bool unique = true;
    for (int32 j = 0; j < tempCount; ++j) {
      if (b2DistanceSquared(v, ps[j]) < ((0.5f * b2_linearSlop) * (0.5f * b2_linearSlop))) {
        unique = false;
        break;
      }
    }

    if (unique) {
      ps[tempCount++] = v;
    }
  }

  n = tempCount;
  if (n < 3) {
    return true;
  }
  return false;
}

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

  if (getScene().getIsEditing()) {
    auto bounds = getScaledEditorBounds(actorId, component, true);
    std::array<b2Vec2, 4> points;

    points[0].x = bounds.centerX - bounds.width / 2.0f;
    points[0].y = bounds.centerY - bounds.height / 2.0f;
    points[1].x = bounds.centerX + bounds.width / 2.0f;
    points[1].y = bounds.centerY - bounds.height / 2.0f;
    points[2].x = bounds.centerX + bounds.width / 2.0f;
    points[2].y = bounds.centerY + bounds.height / 2.0f;
    points[3].x = bounds.centerX - bounds.width / 2.0f;
    points[3].y = bounds.centerY + bounds.height / 2.0f;

    b2PolygonShape shape;
    shape.Set(points.data(), 4);
    addFixture(component, &shape);
  } else {
    // Create new fixtures
    auto widthScale = component.props.widthScale(), heightScale = component.props.heightScale();
    if (fabs(widthScale) < MINIMUM_SCALE) {
      if (widthScale > 0) {
        widthScale = MINIMUM_SCALE;
      } else {
        widthScale = -MINIMUM_SCALE;
      }
    }
    if (fabs(heightScale) < MINIMUM_SCALE) {
      if (heightScale > 0) {
        heightScale = MINIMUM_SCALE;
      } else {
        heightScale = -MINIMUM_SCALE;
      }
    }

    // This check catches some cases that isDegeneratePoly doesn't catch that would throw an error
    for (auto &fixture : component.props.fixtures()) {
      if (fixture.shapeType() == "circle") {
        if (std::abs(std::abs(widthScale) - std::abs(heightScale)) < 0.002) {
          // Uniformly-scaled circle
          b2CircleShape shape;
          shape.m_p = { widthScale * fixture.x(), heightScale * fixture.y() };
          shape.m_radius = std::abs(widthScale) * fixture.radius();
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
          if (!isDegeneratePoly(points.data(), 8)) {
            b2PolygonShape shape;
            shape.Set(points.data(), 8);
            addFixture(component, &shape);
          }
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
        if (!isDegeneratePoly(points.data(), nPoints)) {
          b2PolygonShape shape;
          shape.Set(points.data(), nPoints);
          addFixture(component, &shape);
        }
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

void BodyBehavior::setFixturesFromDrawing(ActorId actorId, std::vector<FixtureProps> fixtures) {
  if (auto component = maybeGetComponent(actorId)) {
    component->props.fixtures() = std::move(fixtures);

    recreateFixtures(actorId, *component, true);
  }
}

ScaledEditorBounds BodyBehavior::getScaledEditorBounds(
    ActorId actorId, BodyComponent &component, bool enforceMinimumSize) {
  ScaledEditorBounds result {};
  auto &editorBounds = component.props.editorBounds();

  result.minX = editorBounds.minX() * component.props.widthScale();
  result.maxX = editorBounds.maxX() * component.props.widthScale();
  result.minY = editorBounds.minY() * component.props.heightScale();
  result.maxY = editorBounds.maxY() * component.props.heightScale();

  result.centerX = (result.maxX + result.minX) / 2.0f;
  result.centerY = (result.maxY + result.minY) / 2.0f;

  result.width = fabs(result.maxX - result.minX);
  result.height = fabs(result.maxY - result.minY);

  if (enforceMinimumSize) {
    if (result.width < EDITOR_BOUNDS_MIN_SIZE) {
      result.width = EDITOR_BOUNDS_MIN_SIZE;
    }
    if (result.height < EDITOR_BOUNDS_MIN_SIZE) {
      result.height = EDITOR_BOUNDS_MIN_SIZE;
    }
  }

  return result;
}
