#pragma once

#include "precomp.h"

#include "lv.h"
#include "library.h"
#include "props.h"
#include "gesture.h"
#include "variables.h"
#include "sound.h"


class AllBehaviors; // Forward declaration otherwise this would be circular...

using ActorId = entt::entity; // Is unique throughout a `Scene`'s lifetime, never recycled
constexpr auto nullActor = entt::null; // An `ActorId`-compatible sentinel value
using ActorIdSet = entt::sparse_set;

struct Actor {
  // Bookkeeping information that is common to all actors. Data specific to each behavior is managed
  // outside of this, in components for that particular behavior.

  Actor(const Actor &) = delete; // Prevent accidental copies
  const Actor &operator=(const Actor &) = delete;
  Actor(Actor &&) = default; // Allow moves
  Actor &operator=(Actor &&) = default;

  // `a.drawOrder < b.drawOrder` means `a` is drawn behind (before) `b`. Draw orders are compacted
  // when sorting so their absolute value is not constant across frames for any particular actor.
  // Only the relative order can be relied upon.
  mutable int drawOrder;
};

class Scene {
  // Maintains the runtime state of a single Castle scene. This involves managing `Actor` instances,
  // tracking them by their `ActorId`, managing behavior instances and the membership of actors in
  // behaviors. Also provides top-level methods for drawing and updating the whole scene.

public:
  Scene(const Scene &) = delete; // Prevent accidental copies
  const Scene &operator=(const Scene &) = delete;
  Scene(Scene &&); // Allow move-construction (lets us return it from `Snapshot`)

  explicit Scene(Variables &variables_, Reader *maybeReader = nullptr);
  ~Scene();


  // Actor management

  ActorId addActor(Reader *maybeReader = nullptr, const char *maybeParentEntryId = nullptr);
  void removeActor(ActorId actorId);

  bool hasActor(ActorId actorId) const; // Whether `actorId` exists. Always `false` for `nullActor`.
  Actor *maybeGetActor(ActorId actorId); // Returns `nullptr` if no such actor. Shortlived -- data
                                         // may move as actors are added / removed.
  const Actor *maybeGetActor(ActorId actorId) const;

  template<typename F>
  void forEachActorByDrawOrder(F &&f); // `f` must take either `(ActorId, Actor &)` or `(Actor &)`
  template<typename F>
  void forEachActorByDrawOrder(F &&f) const;
  template<typename F>
  void forEachActor(F &&f); // `f` as above
  template<typename F>
  void forEachActor(F &&f) const;
  int numActors() const;
  ActorId indexActor(int index) const; // Order maintained as long as actors not added / removed.
                                       // `nullActor` if out of bounds.


  // Behaviors

  AllBehaviors &getBehaviors();
  const AllBehaviors &getBehaviors() const;


  // Physics

  b2World &getPhysicsWorld();
  const b2World &getPhysicsWorld() const;
  b2Body *getPhysicsBackgroundBody();
  int numPhysicsStepsPerformed() const; // Number of 120Hz physics steps performed in this frame


  // Entity registry (entt instance managing component data)

  entt::registry &getEntityRegistry();
  const entt::registry &getEntityRegistry() const;


  // Library

  Library &getLibrary();
  const Library &getLibrary() const;


  // View, camera

  const love::Transform &getViewTransform() const;
  love::Vector2 inverseViewTransformPoint(const love::Vector2 &point) const;
  float getViewScale() const;
  float getPixelScale() const;

  void setCameraTarget(ActorId target);
  love::Vector2 getCameraPosition() const;
  love::Vector2 getCameraSize() const;


  // Gesture

  const Gesture &getGesture() const;


  // Variables

  Variables &getVariables();
  const Variables &getVariables() const;


  // Sound

  Sound &getSound();
  const Sound &getSound() const;


  // Scene-level props

  struct Props {
    PROP(love::Colorf, backgroundColor) = { 227 / 255.0, 230 / 255.0, 252 / 255.0, 1 };
    PROP(int, coordinateSystemVersion) = 0;
  } props;


  // Time

  double getPerformTime() const; // Time under performance since start, not including time paused


  // RNG

  love::RandomGenerator &getRNG();


  // Restarting

  void requestRestart();
  bool isRestartRequested() const;


  // Update, draw

  void update(double dt);

  void draw() const;


private:
  Lv &lv { Lv::getInstance() };
  Variables &variables;
  Sound sound;

  entt::registry registry;
  entt::basic_view<entt::entity, entt::exclude_t<>, Actor> actorView = registry.view<Actor>();

  mutable int nextNewDrawOrder = 0; // Always greater than the draw order of any existing actor
  mutable bool needDrawOrderSort = false;

  struct PhysicsContactListener : b2ContactListener {
    Scene &scene;
    explicit PhysicsContactListener(Scene &scene_);
    void BeginContact(b2Contact *contact) override;
  } physicsContactListener; // Must outlive `physicsWorld` below
  b2World physicsWorld { b2Vec2(0, 9.8) };
  b2Body *physicsBackgroundBody = nullptr;
  int nPhysicsStepsPerformed = 0;
  double physicsUpdateTimeRemaining = 0;

  std::unique_ptr<AllBehaviors> behaviors;

  Library library; // Library instance maintained at scene level for now

  float viewWidth = 10.0, viewHeight = 7.0f * viewWidth / 5.0f;
  mutable love::Transform viewTransform;
  mutable float cameraX = 0, cameraY = 0;
  mutable ActorId cameraTarget = nullActor;

  Gesture gesture { *this };

  double performTime = 0;

  love::RandomGenerator rng;

  bool restartRequested = false;


  void read(Reader &reader);

  void ensureDrawOrderSort() const;
};


// Inlined implementations

inline bool Scene::hasActor(ActorId actorId) const {
  return registry.valid(actorId);
}

inline Actor *Scene::maybeGetActor(ActorId actorId) {
  return registry.valid(actorId) && actorView.contains(actorId)
      ? &std::get<0>(actorView.get(actorId))
      : nullptr;
}

inline const Actor *Scene::maybeGetActor(ActorId actorId) const {
  return registry.valid(actorId) && actorView.contains(actorId)
      ? &std::get<0>(actorView.get(actorId))
      : nullptr;
}

template<typename F>
void Scene::forEachActorByDrawOrder(F &&f) {
  ensureDrawOrderSort();
  actorView.each(std::forward<F>(f));
}

template<typename F>
void Scene::forEachActorByDrawOrder(F &&f) const {
  ensureDrawOrderSort();
  actorView.each(std::forward<F>(f));
}

template<typename F>
void Scene::forEachActor(F &&f) {
  actorView.each(std::forward<F>(f));
}

template<typename F>
void Scene::forEachActor(F &&f) const {
  actorView.each(std::forward<F>(f));
}

inline int Scene::numActors() const {
  return actorView.size();
}

inline ActorId Scene::indexActor(int index) const {
  if (0 <= index && index < int(actorView.size())) {
    return actorView.data()[index];
  } else {
    return nullActor;
  }
}

inline AllBehaviors &Scene::getBehaviors() {
  return *behaviors;
}

inline const AllBehaviors &Scene::getBehaviors() const {
  return *behaviors;
}

inline b2World &Scene::getPhysicsWorld() {
  return physicsWorld;
}

inline const b2World &Scene::getPhysicsWorld() const {
  return physicsWorld;
}

inline b2Body *Scene::getPhysicsBackgroundBody() {
  return physicsBackgroundBody;
}

inline int Scene::numPhysicsStepsPerformed() const {
  return nPhysicsStepsPerformed;
}

inline entt::registry &Scene::getEntityRegistry() {
  return registry;
}

inline const entt::registry &Scene::getEntityRegistry() const {
  return registry;
}

inline Library &Scene::getLibrary() {
  return library;
}

inline const Library &Scene::getLibrary() const {
  return library;
}

inline const love::Transform &Scene::getViewTransform() const {
  return viewTransform;
}

inline love::Vector2 Scene::inverseViewTransformPoint(const love::Vector2 &point) const {
  return viewTransform.inverseTransformPoint(point);
}

inline float Scene::getViewScale() const {
  return viewTransform.getMatrix().getElements()[0]; // Assuming no rotation
}

inline float Scene::getPixelScale() const {
  return float(lv.window.getDPIScale() / getViewScale());
}

inline void Scene::setCameraTarget(ActorId target) {
  cameraTarget = target;
}

inline love::Vector2 Scene::getCameraPosition() const {
  return { cameraX, cameraY };
}

inline love::Vector2 Scene::getCameraSize() const {
  return { viewWidth, viewHeight };
}

inline Variables &Scene::getVariables() {
  return variables;
}

inline const Variables &Scene::getVariables() const {
  return variables;
}

inline Sound &Scene::getSound() {
  return sound;
}

inline const Sound &Scene::getSound() const {
  return sound;
}

inline const Gesture &Scene::getGesture() const {
  return gesture;
}

inline double Scene::getPerformTime() const {
  return performTime;
}

inline love::RandomGenerator &Scene::getRNG() {
  return rng;
}

inline void Scene::requestRestart() {
  restartRequested = true;
}

inline bool Scene::isRestartRequested() const {
  return restartRequested;
}
