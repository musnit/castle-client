#include "tests.h"

#ifdef CASTLE_ENABLE_TESTS

#undef NDEBUG // To make sure `assert`s aren't elided in release builds
#include <cassert>

#include "scene.h"
#include "snapshot.h"
#include "platform.h"
#include "behaviors/all.h"
#include "token_map.h"


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
    assert(scene.maybeGetActor(actor2)->drawOrder == 0);
    assert(scene.maybeGetActor(actor1)->drawOrder == 1);
    assert(scene.maybeGetActor(actor1)->drawOrder == 1);

    // Add another actor and check again
    auto actor3 = scene.addActor();
    {
      std::vector<ActorId> results;
      scene.forEachActorByDrawOrder([&](ActorId actorId, Actor &) {
        results.push_back(actorId);
      });
      assert(results == std::vector<ActorId>({ actor2, actor1, actor3 }));
    }
    assert(scene.maybeGetActor(actor2)->drawOrder == 0);
    assert(scene.maybeGetActor(actor1)->drawOrder == 1);
    assert(scene.maybeGetActor(actor3)->drawOrder == 2);

    // Check passing to `const Scene &`
    const auto testConstScene = [&](const Scene &scene) {
      std::vector<ActorId> results;
      scene.forEachActorByDrawOrder([&](ActorId actorId, const Actor &) {
        results.push_back(actorId);
      });
      assert(results == std::vector<ActorId>({ actor2, actor1, actor3 }));
    };
    testConstScene(scene);

    // Remove two actors and check again
    scene.removeActor(actor2);
    scene.removeActor(actor3);
    assert(!scene.hasActor(actor2));
    assert(!scene.maybeGetActor(actor2));
    {
      std::vector<ActorId> results;
      scene.forEachActorByDrawOrder([&](ActorId actorId, Actor &) {
        results.push_back(actorId);
      });
      assert(results == std::vector<ActorId>({ actor1 }));
    }
    assert(scene.maybeGetActor(actor1)->drawOrder == 0);

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
    assert(scene.maybeGetActor(actor4)->drawOrder == 0);
  }
};


//
// Basic drawing loading
//

struct BasicDrawingLoadingTest : Test {
  BasicDrawingLoadingTest() {
    auto scene = Snapshot::fromFile(Platform::getAssetPath("test-drawing2.json").c_str()).toScene();

    // Can query and check component data now. May need to `friend class BasicDrawingLoadingTest` in
    // `Drawing2Behavior`...
  }
};


//
// Token map
//

struct TokenMapTest : Test {
  TokenMapTest() {
    struct TestValue {
      int i = -1;
    };

    TokenMap<TestValue> tm;

    // Make sure no values initially
    auto tok1 = tm.getToken("1");
    assert(!tm.lookup(tok1));
    auto tok2 = tm.getToken("2");
    assert(!tm.lookup(tok2));
    auto tok3 = tm.getToken("3");
    assert(!tm.lookup(tok3));

    // Try insert and lookup, modify, and lookup again
    {
      tm.insert(tok1, { 10 });
      auto val1 = tm.lookup(tok1);
      assert(val1);
      assert(val1->i == 10);
      val1->i = 11;
    }
    {
      auto val1 = tm.lookup(tok1);
      assert(val1);
      assert(val1->i == 11);
    }
    assert(!tm.lookup(tok2));
    assert(!tm.lookup(tok3));

    // Insert at another key
    {
      tm.insert(tok2, { 20 });
      auto val2 = tm.lookup(tok2);
      assert(val2);
      assert(val2->i == 20);
    }
    assert(tm.lookup(tok1));
    assert(!tm.lookup(tok3));

    // Try looking up by generating another token for same string
    {
      auto val1 = tm.lookup(tm.getToken("1"));
      assert(val1);
      assert(val1->i == 11);
      auto val2 = tm.lookup(tm.getToken("2"));
      assert(val2);
      assert(val2->i == 20);
    }

    // Large test
    std::vector<decltype(tm)::Token> tokens;
    for (auto i = 0; i < 1000; ++i) {
      auto &tok = tokens.emplace_back(tm.getToken(fmt::format("large{}", i).c_str()));
      if (i % 2 == 0) {
        tm.insert(tok, { 10 * i });
      }
    }
    for (auto i = 0; i < 1000; ++i) {
      auto val = tm.lookup(tokens[i]);
      auto val2 = tm.lookup(tm.getToken(fmt::format("large{}", i).c_str()));
      if (i % 2 == 0) {
        assert(val);
        assert(val->i == 10 * i);
        assert(val2);
        assert(val2->i == 10 * i);
        val->i = 100 * i;
      } else {
        assert(!val);
        assert(!val2);
      }
    }
    for (auto i = 0; i < 1000; ++i) {
      auto val = tm.lookup(tokens[i]);
      auto val2 = tm.lookup(tm.getToken(fmt::format("large{}", i).c_str()));
      if (i % 2 == 0) {
        assert(val);
        assert(val->i == 100 * i);
        assert(val2);
        assert(val2->i == 100 * i);
      } else {
        assert(!val);
        assert(!val2);
      }
    }
  }
};


//
// Constructor, destructor
//

Tests::Tests() {
  tests.emplace_back(std::make_unique<BasicActorManagementTest>());
  tests.emplace_back(std::make_unique<BasicDrawingLoadingTest>());
  tests.emplace_back(std::make_unique<TokenMapTest>());
  Debug::log("all tests passed");
}


//
// Update
//

void Tests::update(double dt) {
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
