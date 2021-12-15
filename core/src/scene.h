#pragma once

#include "precomp.h"

#include "lv.h"
#include "props.h"
#include "gesture.h"
#include "variables.h"
#include "clock.h"
#include "sound.h"
#include "bridge.h"


class AllBehaviors; // Forward declaration otherwise this would be circular...
class Library;
class Screenshot;

using ActorId = entt::entity; // Is unique throughout a `Scene`'s lifetime, never recycled
constexpr ActorId nullActor = entt::null; // An `ActorId`-compatible sentinel value
using ActorIdSet = entt::sparse_set; // Good for fast membership checks and maintaining a set of
                                     // `ActorId`s over a long time (eg. in `TagsBehavior`). Might
                                     // take up a lot of memory / may have heavy lifecycle cost.

struct SceneDrawingOptions {
  bool drawInvisibleActors = false;
  ActorId editorDrawingActorId = nullActor;
  int editorDrawingAnimationFrame = -1;
  float windowWidth = 0.0f;
};

class Scene {
  // Maintains the runtime state of a single Castle scene. This involves managing actor creation and
  // destruction, draw orders, managing behavior instances and the membership of actors in
  // behaviors. Also provides top-level methods for drawing and updating the whole scene.

public:
  Scene(const Scene &) = delete; // Prevent accidental copies
  const Scene &operator=(const Scene &) = delete;

  explicit Scene(
      Bridge &bridge_, Variables &variables_, bool isEditing_, Reader *maybeReader = nullptr);
  ~Scene();


  // Read / write

  void write(Writer &writer) const;


  // Draw order

  struct DrawOrder {
    int value = -1;
    int tieBreak = 0;
    bool operator<(const DrawOrder &other) const;
  };
  static constexpr DrawOrder minDrawOrder { -1, 0 };
  const DrawOrder *maybeGetDrawOrder(ActorId actorId) const; // `nullptr` if invalid. Shortlived,
                                                             // may move as actors added / removed.
  void ensureDrawOrderSort() const;
  template<typename F>
  void forEachActorByDrawOrder(F &&f) const; // `f` must take `(ActorId)`

  struct DrawOrderParams {
    enum Relativity { BehindAll, Behind, FrontOf, FrontOfAll };
    Relativity relativity = FrontOfAll;
    ActorId relativeToActor = nullActor;
    std::optional<int> relativeToValue;
  };
  void setDrawOrder(ActorId actorId, DrawOrderParams params);


  // Actor management

  struct ActorDesc {
    ActorId requestedActorId = nullActor;
    Reader *reader = nullptr;
    const char *parentEntryId = nullptr;
    bool inherit = true; // `false` when loading old scenes that stored data duplicated on actors
    DrawOrderParams drawOrderParams = {};
    bool isGhost = false;
    std::optional<love::Vector2> pos;
  };
  ActorId addActor(const ActorDesc &params);
  ActorId generateActorId();
  void removeActor(ActorId actorId);
  bool hasActor(ActorId actorId) const; // Whether `actorId` exists. Always `false` for `nullActor`.
                                        // may move as actors are added / removed.
  template<typename F>
  void forEachActor(F &&f) const; // `f` must take `(ActorId)`
  int numActors() const;
  ActorId indexActor(int index) const; // Order maintained as long as actors not added / removed.
                                       // `nullActor` if out of bounds.

  struct WriteActorParams {
    bool inheritedProperties = false;
    bool layoutProperties = true;
  };
  void writeActor(ActorId actorId, Writer &writer, WriteActorParams) const;


  // Parent entry

  struct ParentEntryIdData {
    std::string parentEntryId;
  };
  const char *maybeGetParentEntryId(ActorId actorId) const; // `nullptr` if no parent entry
  void setParentEntryId(ActorId actorId, const char *newParentEntryId); // Set `nullptr` to remove


  // Ghost

  struct Ghost {};
  bool isGhost(ActorId actorId) const; // Whether given actor is a ghost (invisible actor created to
                                       // inspect uninstantiated blueprints selected in belt)


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
  love::Vector2 inverseViewTransformPoint(love::Vector2 point) const;
  float getViewYOffset() const;
  float getDefaultViewYOffset() const;
  float getViewScale() const;
  inline static float uiPixelRatio = 3; // From React Native. Default of 3 is based on iPhone XS.
  float getPixelScale() const;

  void setCameraTarget(ActorId target);
  love::Vector2 getCameraPosition() const;
  void setCameraPosition(love::Vector2 pos);
  love::Vector2 getCameraSize() const;
  static constexpr float defaultViewWidth = 10;
  love::Vector2 getDefaultCameraSize() const;
  float getCameraZoom() const;
  void setViewWidth(float newViewWidth);
  float getViewWidth();


  // Gesture

  const Gesture &getGesture() const;


  // Variables

  Variables &getVariables();
  const Variables &getVariables() const;


  // Bridge

  Bridge &getBridge();
  const Bridge &getBridge() const;


  // Editing state - only settable in constructor
  bool getIsEditing();


  // Sound

  Sound &getSound();
  const Sound &getSound() const;

  // Clock
  Clock &getClock();
  const Clock &getClock() const;


  // Scene-level props

  struct Props {
    PROP(love::Colorf, backgroundColor) = { 186 / 255.0, 190 / 255.0, 246 / 255.0, 1 };
    PROP(int, coordinateSystemVersion) = 2;
    PROP(int, clockTempo) = 120;
  } props;

  bool isBackgroundDark() const;


  // Time

  double getPerformTime() const; // Time under performance since start, not including time paused


  // RNG

  love::RandomGenerator &getRNG();


  // Restarting

  void requestRestart();
  bool isRestartRequested() const;

  // Changing cards
  void setNextCardId(std::optional<std::string>);
  std::optional<std::string> getNextCardId();


  // Update, draw

  void update(double dt);
  void updateGesture();

  void draw(std::optional<SceneDrawingOptions> options = std::nullopt) const;
  void applyViewTransform(float windowWidth) const;

  void sendScreenshot();


private:
  Lv &lv { Lv::getInstance() };
  Variables &variables;
  Bridge &bridge;
  bool isEditing;
  Sound sound;
  Clock clock { *this };

  entt::registry registry;

  entt::basic_view<entt::entity, entt::exclude_t<>, DrawOrder> drawOrderView
      = registry.view<DrawOrder>();
  static constexpr auto backDrawOrder = 0; // Always less than draw order value of any actor
  mutable int frontDrawOrder = 1; // Always greater than draw order value of any actor
  static constexpr auto initialDrawOrderTieBreak
      = std::numeric_limits<int>::max() - 32; // `- 32` to stay away from overflow
  mutable int nextDrawOrderTieBreak = initialDrawOrderTieBreak; // Start near max, move toward zero
  mutable bool needDrawOrderSort = false;

  entt::basic_view<entt::entity, entt::exclude_t<>, ParentEntryIdData> parentEntryIdView
      = registry.view<ParentEntryIdData>();

  entt::basic_view<entt::entity, entt::exclude_t<>, Ghost> ghostView = registry.view<Ghost>();

  struct PhysicsContactListener : b2ContactListener {
    Scene &scene;
    explicit PhysicsContactListener(Scene &scene_);
    void BeginContact(b2Contact *contact) override;
    void EndContact(b2Contact *contact) override;
  } physicsContactListener; // Must outlive `physicsWorld` below
  b2World physicsWorld { b2Vec2(0, 9.8) };
  b2Body *physicsBackgroundBody = nullptr;
  int nPhysicsStepsPerformed = 0;
  double physicsUpdateTimeRemaining = 0;

  std::unique_ptr<AllBehaviors> behaviors;

  std::unique_ptr<Library> library; // Library instance maintained at scene level for now

  float viewWidth = defaultViewWidth;
  mutable love::Transform viewTransform;
  mutable float cameraX = 0, cameraY = 0;
  mutable ActorId cameraTarget = nullActor;

  Gesture gesture { *this };

  double performTime = 0;

  love::RandomGenerator rng;

  bool restartRequested = false;
  std::optional<std::string> nextCardId;

  std::unique_ptr<Screenshot> screenshot;


  void read(Reader &reader);
};


// Inlined implementations

inline bool Scene::hasActor(ActorId actorId) const {
  return registry.valid(actorId);
}

template<typename F>
void Scene::forEachActor(F &&f) const {
  drawOrderView.each([&](ActorId actorId, const DrawOrder &order) {
    if (!isGhost(actorId)) {
      f(actorId);
    }
  });
}

inline int Scene::numActors() const {
  return drawOrderView.size();
}

inline ActorId Scene::indexActor(int index) const {
  if (0 <= index && index < int(drawOrderView.size())) {
    return drawOrderView.data()[index];
  } else {
    return nullActor;
  }
}

inline const Scene::DrawOrder *Scene::maybeGetDrawOrder(ActorId actorId) const {
  return registry.valid(actorId) && drawOrderView.contains(actorId)
      ? &std::get<0>(drawOrderView.get(actorId))
      : nullptr;
}

inline bool Scene::DrawOrder::operator<(const DrawOrder &other) const {
  return std::tie(value, tieBreak) < std::tie(other.value, other.tieBreak);
}

template<typename F>
inline void Scene::forEachActorByDrawOrder(F &&f) const {
  ensureDrawOrderSort();
  forEachActor(std::forward<F>(f));
}

inline void Scene::setDrawOrder(ActorId actorId, DrawOrderParams params) {
  DrawOrder drawOrder;
  auto drawOrderRelativity = params.relativity;
  if (drawOrderRelativity == DrawOrderParams::Behind
      || drawOrderRelativity == DrawOrderParams::FrontOf) {
    if (params.relativeToValue) {
      // Relative to given direct draw order value -- tie break is set later below
      drawOrder.value = *params.relativeToValue;
    } else if (auto otherDrawOrder = maybeGetDrawOrder(params.relativeToActor)) {
      // Relative to found given actor -- tie break is set later below
      drawOrder.value = otherDrawOrder->value;
    } else {
      // Front of all if given actor not found
      drawOrderRelativity = DrawOrderParams::FrontOfAll;
    }
  }
  if (drawOrderRelativity == DrawOrderParams::BehindAll) {
    // Behind all means in front of the 'back' sentinel value
    drawOrder.value = backDrawOrder;
    drawOrderRelativity = DrawOrderParams::FrontOf;
  }
  if (drawOrderRelativity == DrawOrderParams::FrontOfAll) {
    // Front of all means behind the 'front' sentinel value
    drawOrder.value = frontDrawOrder;
    drawOrderRelativity = DrawOrderParams::Behind;
  }
  if (drawOrderRelativity == DrawOrderParams::Behind) {
    // Next negative tie break closer to zero
    drawOrder.tieBreak = -(nextDrawOrderTieBreak--);
  }
  if (drawOrderRelativity == DrawOrderParams::FrontOf) {
    // Next positive tie break closer to zero
    drawOrder.tieBreak = nextDrawOrderTieBreak--;
  }
  registry.emplace_or_replace<DrawOrder>(actorId, drawOrder);
  needDrawOrderSort = true;
}

inline const char *Scene::maybeGetParentEntryId(ActorId actorId) const {
  if (registry.valid(actorId) && parentEntryIdView.contains(actorId)) {
    return std::get<0>(parentEntryIdView.get(actorId)).parentEntryId.c_str();
  } else {
    return nullptr;
  }
}

inline void Scene::setParentEntryId(ActorId actorId, const char *newParentEntryId) {
  if (registry.valid(actorId)) {
    if (newParentEntryId) {
      registry.get_or_emplace<ParentEntryIdData>(actorId).parentEntryId = newParentEntryId;
    } else {
      registry.remove_if_exists<ParentEntryIdData>(actorId);
    }
  }
}

inline bool Scene::isGhost(ActorId actorId) const {
  return registry.valid(actorId) && ghostView.contains(actorId);
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
  return *library;
}

inline const Library &Scene::getLibrary() const {
  return *library;
}

inline const love::Transform &Scene::getViewTransform() const {
  return viewTransform;
}

inline love::Vector2 Scene::inverseViewTransformPoint(love::Vector2 point) const {
  return viewTransform.inverseTransformPoint(point);
}

inline float Scene::getViewYOffset() const {
  return 0.5f * (props.coordinateSystemVersion() == 2 ? getCameraSize().y : viewWidth);
}

inline float Scene::getDefaultViewYOffset() const {
  return 0.5f
      * (props.coordinateSystemVersion() == 2 ? getDefaultCameraSize().y : defaultViewWidth);
}

inline float Scene::getViewScale() const {
  return viewTransform.getMatrix().getElements()[0]; // Assuming no rotation
}

inline float Scene::getPixelScale() const {
  return float(lv.window.getDPIScale() / getViewScale()) * uiPixelRatio / 3;
}

inline void Scene::setCameraTarget(ActorId target) {
  cameraTarget = target;
}

inline love::Vector2 Scene::getCameraPosition() const {
  return { cameraX, cameraY };
}

inline void Scene::setCameraPosition(love::Vector2 pos) {
  cameraX = pos.x;
  cameraY = pos.y;
}

inline love::Vector2 Scene::getCameraSize() const {
  return { viewWidth, 7.0f * viewWidth / 5.0f };
}

inline love::Vector2 Scene::getDefaultCameraSize() const {
  return { defaultViewWidth, 7.0f * defaultViewWidth / 5.0f };
};

inline float Scene::getCameraZoom() const {
  return viewWidth / defaultViewWidth;
}

inline void Scene::setViewWidth(float newViewWidth) {
  viewWidth = newViewWidth;
}

inline float Scene::getViewWidth() {
  return viewWidth;
}

inline Variables &Scene::getVariables() {
  return variables;
}

inline const Variables &Scene::getVariables() const {
  return variables;
}

inline Bridge &Scene::getBridge() {
  return bridge;
}

inline const Bridge &Scene::getBridge() const {
  return bridge;
}

inline bool Scene::getIsEditing() {
  return isEditing;
}

inline Sound &Scene::getSound() {
  return sound;
}

inline const Sound &Scene::getSound() const {
  return sound;
}

inline Clock &Scene::getClock() {
  return clock;
}

inline const Clock &Scene::getClock() const {
  return clock;
}

inline bool Scene::isBackgroundDark() const {
  auto col = props.backgroundColor();
  auto brightness = (299 * col.r + 587 * col.g + 114 * col.b) / 1000;
  return brightness < 0.5;
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

inline std::optional<std::string> Scene::getNextCardId() {
  return nextCardId;
}
