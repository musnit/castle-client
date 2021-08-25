#pragma once

#include "precomp.h"
#include "archive.h"
#include <thread>

class API {
private:
  inline static std::mutex cacheLock;
  inline static std::unordered_map<std::string, std::list<std::function<void(bool, Reader &)>>>
      queryToPendingCallbacks;
  inline static std::unordered_map<std::string, std::string> cachedResponses;
  inline static std::unordered_map<std::string, std::string> cachedCards;

  static std::string postRequest(const std::string &);

  static void graphqlThread(const std::string &query) {
    Archive requestBodyArchive;
    requestBodyArchive.write([&](Archive::Writer &writer) {
      writer.obj("variables", [&]() {
      });

      writer.str("query", query);
    });
    std::string requestBody = requestBodyArchive.toJson();

    // TODO: error handling
    std::string result = postRequest(requestBody);

    cacheLock.lock();

    cachedResponses[query] = result;
    auto callbacks = queryToPendingCallbacks[query];
    queryToPendingCallbacks.erase(query);
    cacheLock.unlock();

    for (auto const &callback : callbacks) {
      auto archive = Archive::fromJson(result.c_str());
      archive.read([&](Reader &reader) {
        callback(true, reader);
      });
    }
  }

  static std::string deckQuery(const std::string &deckId) {
    return "{\n  deck(deckId: \"" + deckId
        + "\") {\n    variables\n    initialCard {\n     "
          " cardId\n    sceneData\n    }\n  }\n}\n";
  }

public:
  static void preloadDeck(const std::string &deckId) {
    graphql(
        deckQuery(deckId),
        [=](bool success, Reader &reader) {
        },
        false);
  }

  static void preloadNextCards(const std::string &cardId) {
    graphql(
        "{\n  card(cardId: \"" + cardId
            + "\") {\n    nextCards {\n      cardId\n      sceneDataString\n    }\n  }\n}\n",
        [=](bool success, Reader &reader) {
          reader.obj("data", [&]() {
            reader.obj("card", [&]() {
              reader.each("nextCards", [&]() {
                std::string cardId = reader.str("cardId", "");
                std::string sceneDataString = reader.str("sceneDataString", "");

                cachedCards[cardId] = sceneDataString;
              });
            });
          });
        },
        false);
  }

  static void loadCard(const std::string &cardId, bool useCache, const std::function<void(Reader &)> &snapshotCallback) {
    if (cachedCards.find(cardId) != cachedCards.end()) {
      auto archive = Archive::fromJson(cachedCards[cardId].c_str());
      archive.read([&](Reader &reader) {
        reader.obj("snapshot", [&]() {
          snapshotCallback(reader);
        });
      });
    } else {
      graphql(
          "{\n  card(cardId: \"" + std::string(cardId) + "\") {\n    sceneData\n  }\n}\n",
          [=](bool success, Reader &reader) {
            reader.obj("data", [&]() {
              reader.obj("card", [&]() {
                reader.obj("sceneData", [&]() {
                  reader.obj("snapshot", [&]() {
                    snapshotCallback(reader);
                  });
                });
              });
            });
          },
          useCache);
    }

    preloadNextCards(cardId);
  }

  static void loadDeck(const std::string &deckId, bool useCache,
      const std::function<void(Reader &)> &variablesCallBack,
      const std::function<void(Reader &)> &snapshotCallback) {
    graphql(
        deckQuery(deckId),
        [=](bool success, Reader &reader) {
          reader.obj("data", [&]() {
            reader.obj("deck", [&]() {
              reader.arr("variables", [&]() {
                variablesCallBack(reader);
              });
              reader.obj("initialCard", [&]() {
                reader.obj("sceneData", [&]() {
                  reader.obj("snapshot", [&]() {
                    snapshotCallback(reader);
                  });
                });

                std::string cardId = reader.str("cardId", "");
                preloadNextCards(cardId);
              });
            });
          });
        },
        useCache);
  }

  static void graphql(const std::string &query, const std::function<void(bool, Reader &)> &callback,
      bool useCache) {
    bool usingCache = false;
    if (useCache) {
      if (cachedResponses.find(query) != cachedResponses.end()) {
        auto archive = Archive::fromJson(cachedResponses[query].c_str());
        archive.read([&](Reader &reader) {
          callback(true, reader);
        });

        usingCache = true;
      } else {
        cacheLock.lock();
        if (queryToPendingCallbacks.find(query) != queryToPendingCallbacks.end()) {
          queryToPendingCallbacks[query].push_back(callback);
          usingCache = true;
        }
        cacheLock.unlock();
      }
    }


    if (!usingCache) {
      cacheLock.lock();
      queryToPendingCallbacks.insert({ query, { callback } });

#ifdef ANDROID
      cacheLock.unlock();
      graphqlThread(query);
#else
      std::thread { &API::graphqlThread, query }.detach();
      cacheLock.unlock();
#endif
    }
  }
};
