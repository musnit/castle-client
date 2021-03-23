#include "scene.h"


//
// Actor management
//

ActorId Scene::addActor() {
  auto actorId = registry.create();
  auto drawOrder = 0;
  auto numActors = registry.size<Actor>();
  if (numActors > 0) {
    auto highestDrawOrderId = registry.data<Actor>()[numActors - 1];
    drawOrder = getActor(highestDrawOrderId).drawOrder;
  }
  registry.emplace<Actor>(actorId, actorId, drawOrder);
  actorsNeedSort = true;
  return actorId;
}

void Scene::removeActor(ActorId actorId) {
  if (!hasActor(actorId)) {
    fmt::print("removeActor: no such actor");
    return;
  }

  // TODO(nikki): Call behavior disable component handlers

  registry.destroy(actorId);
  actorsNeedSort = true;
}

void Scene::setActorDrawOrder(ActorId actorId, int newDrawOrder) {
  getActor(actorId).drawOrder = newDrawOrder;
  actorsNeedSort = true;
}
