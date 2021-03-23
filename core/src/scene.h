#include "precomp.h"


using ActorId = entt::entity; // An integer unique to each actor that identifies it
const auto ActorNull = entt::null; // An `ActorId`-compatible value that no actor is identified by

struct Actor {
  // Bookkeeping information that is common to all actors. Data specific to
  // each behavior is managed outside of this, in components for that
  // particular behavior.

  Actor(const Actor &) = delete; // Prevent accidental copies
  const Actor &operator=(const Actor &) = delete;
  Actor(Actor &&) = default; // Allow moves
  Actor &operator=(Actor &&) = default;

  ActorId actorId;
  mutable int drawOrder; // `a.drawOrder < b.drawOrder` means `a` is drawn behind (before) `b`. Draw
                         // orders are compacted when iterating so the absolute draw order value of
                         // an actor cannot be relied upon across frames.
};

class Scene {
  // Maintains the runtime state of a single Castle scene. This involves
  // managing `Actor` instances, tracking them by their `ActorId`, managing
  // behavior instances and the membership of actors in behaviors. Also
  // provides top-level methods for drawing and updating the whole scene.

public:
  static constexpr auto debugChecks = true; // `false` to disable debug reporting (eg. invalid
                                            // `ActorId`s) and gain a slight performance boost

  Scene(const Scene &) = delete; // Prevent accidental copies
  const Scene &operator=(const Scene &) = delete;

  Scene() = default;
  ~Scene() = default;


  // Actor management

  ActorId addActor();
  void removeActor(ActorId actorId);

  bool hasActor(ActorId actorId) const;
  Actor &getActor(ActorId actorId); // Undefined behavior if no such actor!
  const Actor &getActor(ActorId actorId) const;

  void setActorDrawOrder(ActorId actorId, int drawOrder);
  template<typename F>
  void forEachActorByDrawOrder(F &&f);


private:
  entt::registry registry;

  mutable bool actorsNeedSort = false; // Whether need a draw order sort before next iteration
};


// Inlined implementations

inline bool Scene::hasActor(ActorId actorId) const {
  return registry.valid(actorId);
}

inline Actor &Scene::getActor(ActorId actorId) {
  if constexpr (Scene::debugChecks) {
    if (!hasActor(actorId)) {
      fmt::print("getActor: no such actor");
    }
  }
  return registry.get<Actor>(actorId);
}

inline const Actor &Scene::getActor(ActorId actorId) const {
  if constexpr (Scene::debugChecks) {
    if (!hasActor(actorId)) {
      fmt::print("getActor: no such actor");
    }
  }
  return registry.get<Actor>(actorId);
}

template<typename F>
void Scene::forEachActorByDrawOrder(F &&f) {
  if (actorsNeedSort) {
    registry.sort<Actor>(
        [&](const Actor &a, const Actor &b) {
          return a.drawOrder < b.drawOrder;
        },
        entt::insertion_sort());
    actorsNeedSort = false;
    auto nextCompactDrawOrder = 0;
    registry.view<Actor>().each([&](const Actor &actor) {
      actor.drawOrder = nextCompactDrawOrder++;
    });
  }
  registry.view<Actor>().each(f);
}
