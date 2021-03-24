#include "scene.h"

#include "behaviors/all.h"


//
// Constructor, destructor
//

Scene::Scene()
    : behaviorsHolder(std::make_unique<AllBehaviors>(*this))
    , behaviors(*behaviorsHolder) {
}

Scene::~Scene() {
}


//
// Actor management
//

ActorId Scene::addActor() {
  auto newActorId = registry.create();
  registry.emplace<Actor>(newActorId, newActorId, nextNewDrawOrder++);
  needDrawOrderSort = true;
  return newActorId;
}

void Scene::removeActor(ActorId actorId) {
  if (!hasActor(actorId)) {
    fmt::print("removeActor: no such actor");
    return;
  }

  // TODO(nikki): Call behavior disable component handlers

  registry.destroy(actorId);
  needDrawOrderSort = true;
}

void Scene::setActorDrawOrder(ActorId actorId, int newDrawOrder) {
  getActor(actorId).drawOrder = newDrawOrder;
  nextNewDrawOrder = std::max(nextNewDrawOrder, newDrawOrder + 1);
  needDrawOrderSort = true;
}

void Scene::ensureDrawOrderSort() const {
  if (needDrawOrderSort) {
    const_cast<entt::registry &>(registry).sort<Actor>([&](const Actor &a, const Actor &b) {
      return a.drawOrder < b.drawOrder;
    });
    needDrawOrderSort = false;
    auto nextCompactDrawOrder = 0;
    registry.view<const Actor>().each([&](const Actor &actor) {
      actor.drawOrder = nextCompactDrawOrder++;
    });
    nextNewDrawOrder = nextCompactDrawOrder;
  }
}
