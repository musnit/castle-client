#include "tests.h"

#ifdef CASTLE_ENABLE_TESTS

#undef NDEBUG // To make sure `assert`s aren't elided in release builds
#include <cassert>

#include "scene.h"
#include "behaviors/all.h"


//
// Basic actor management (add, remove, draw order)
//

struct BasicActorManagementTest : Test {
  BasicActorManagementTest() {
    Scene scene;

    // Add two actors
    auto actor1 = scene.addActor();
    assert(scene.hasActor(actor1));
    auto actor2 = scene.addActor();
    assert(scene.hasActor(actor2));

    // Check draw order
    {
      std::vector<ActorId> results;
      scene.forEachActorByDrawOrder([&](ActorId actorId, Actor &) {
        results.push_back(actorId);
      });
      assert(results == std::vector<ActorId>({ actor1, actor2 }));
    }

    // Modify draw order and check again, making sure compacted
    scene.setActorDrawOrder(actor1, 20);
    {
      std::vector<ActorId> results;
      scene.forEachActorByDrawOrder([&](ActorId actorId, Actor &) {
        results.push_back(actorId);
      });
      assert(results == std::vector<ActorId>({ actor2, actor1 }));
    }
    assert(scene.getActor(actor2).drawOrder == 0);
    assert(scene.getActor(actor1).drawOrder == 1);

    // Add another actor and check again
    auto actor3 = scene.addActor();
    {
      std::vector<ActorId> results;
      scene.forEachActorByDrawOrder([&](ActorId actorId, Actor &) {
        results.push_back(actorId);
      });
      assert(results == std::vector<ActorId>({ actor2, actor1, actor3 }));
    }
    assert(scene.getActor(actor2).drawOrder == 0);
    assert(scene.getActor(actor1).drawOrder == 1);
    assert(scene.getActor(actor3).drawOrder == 2);

    // Check passing to `const Scene &`
    const auto foo = [&](const Scene &scene) {
      std::vector<ActorId> results;
      scene.forEachActorByDrawOrder([&](ActorId actorId, const Actor &) {
        results.push_back(actorId);
      });
      assert(results == std::vector<ActorId>({ actor2, actor1, actor3 }));
    };
    foo(scene);

    // Remove two actors and check again
    scene.removeActor(actor2);
    scene.removeActor(actor3);
    assert(!scene.hasActor(actor2));
    {
      std::vector<ActorId> results;
      scene.forEachActorByDrawOrder([&](ActorId actorId, Actor &) {
        results.push_back(actorId);
      });
      assert(results == std::vector<ActorId>({ actor1 }));
    }
    assert(scene.getActor(actor1).drawOrder == 0);

    // Remove last actor and check empty
    scene.removeActor(actor1);
    assert(!scene.hasActor(actor1));
    {
      std::vector<ActorId> results;
      scene.forEachActorByDrawOrder([&](ActorId actorId, Actor &) {
        results.push_back(actorId);
      });
      assert(results == std::vector<ActorId>());
    }

    // Make sure new IDs aren't equal to old ones
    auto actor4 = scene.addActor();
    assert(actor1 != actor4);
    assert(actor2 != actor4);
    assert(actor3 != actor4);
    {
      std::vector<ActorId> results;
      scene.forEachActorByDrawOrder([&](ActorId actorId, Actor &) {
        results.push_back(actorId);
      });
      assert(results == std::vector<ActorId>({ actor4 }));
    }
    assert(scene.getActor(actor4).drawOrder == 0);
  }
};


//
// Basic component management (add, remove, has, get, handlers)
//

struct BasicComponentManagementTest : Test {
  BasicComponentManagementTest() {
    Scene scene;
    auto &testBehavior = scene.behaviors.get<TestBehavior>();

    // Add two actors
    auto actor1 = scene.addActor();
    auto actor2 = scene.addActor();

    // Add component to one of them, check all of the things
    testBehavior.addComponent(actor1);
    assert(testBehavior.hasComponent(actor1));
    assert(testBehavior.getComponent(actor1).i == 0);
    assert((testBehavior.adds == std::vector<std::pair<ActorId, int>> { { actor1, 0 } }));
    assert((testBehavior.disables == std::vector<std::pair<ActorId, int>> {}));
    testBehavior.adds.clear();
    testBehavior.disables.clear();

    // Add component to another, then check again
    testBehavior.addComponent(actor2);
    assert(testBehavior.hasComponent(actor2));
    assert(testBehavior.getComponent(actor1).i == 0);
    assert(testBehavior.getComponent(actor2).i == 1);
    assert((testBehavior.adds == std::vector<std::pair<ActorId, int>> { { actor2, 1 } }));
    assert((testBehavior.disables == std::vector<std::pair<ActorId, int>> {}));
    testBehavior.adds.clear();
    testBehavior.disables.clear();

    // Remove from one actor
    testBehavior.removeComponent(actor1);
    assert(!testBehavior.hasComponent(actor1));
    assert(testBehavior.getComponent(actor2).i == 1);
    assert((testBehavior.disables == std::vector<std::pair<ActorId, int>> { { actor1, 0 } }));
    testBehavior.adds.clear();
    testBehavior.disables.clear();

    // Create two actors and add to them, check again
    auto actor3 = scene.addActor();
    auto actor4 = scene.addActor();
    testBehavior.addComponent(actor3);
    testBehavior.addComponent(actor4);
    assert((testBehavior.adds
        == std::vector<std::pair<ActorId, int>> { { actor3, 2 }, { actor4, 3 } }));
    assert((testBehavior.disables == std::vector<std::pair<ActorId, int>> {}));

    // TODO(nikki): Test `forEachComponent`

    // TODO(nikki): Test calling disable handlers on actor destroy
  }
};


//
// Constructor, destructor
//

Tests::Tests() {
  tests.emplace_back(std::make_unique<BasicActorManagementTest>());
  tests.emplace_back(std::make_unique<BasicComponentManagementTest>());
}


//
// Update
//

void Tests::update([[maybe_unused]] double dt) {
  for (auto &test : tests) {
    test->update(dt);
  }
}


//
// Draw
//

void Tests::draw() {
  for (auto &test : tests) {
    test->draw();
  }
}


#endif
