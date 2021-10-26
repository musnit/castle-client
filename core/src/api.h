#pragma once

#include "precomp.h"
#include "archive.h"
#include <thread>

namespace CastleAPI {
void postRequest(const std::string &body,
    const std::function<void(bool, std::string, std::string)>
        callback); // Implemented in platform-specific files
}

struct APIResponse {
  bool success;
  std::string error;
  Reader &reader;

  APIResponse(bool success, std::string error, Reader &reader)
      : success(success)
      , error(error)
      , reader(reader) {
  }
};

class API {
private:
  struct APICacheResponse {
    bool success;
    std::string error;
    std::string result;

    APICacheResponse() {
    }

    APICacheResponse(bool success, std::string error, std::string result)
        : success(success)
        , error(error)
        , result(result) {
    }

    void loadAPIResponse(const std::function<void(APIResponse &)> &callback) const {
      if (success) {
        auto archive = Archive::fromJson(result.c_str());
        archive.read([&](Reader &reader) {
          APIResponse response(true, error, reader);
          callback(response);
        });
      } else {
        auto archive = Archive::fromJson("{}");
        archive.read([&](Reader &reader) {
          APIResponse response(false, error, reader);
          callback(response);
        });
      }
    }
  };

  inline static std::mutex cacheLock;
  inline static std::unordered_map<std::string, std::list<std::function<void(APIResponse &)>>>
      queryToPendingCallbacks;
  inline static std::unordered_map<std::string, APICacheResponse> cachedResponses;
  inline static std::unordered_map<std::string, APICacheResponse> cachedCards;
  inline static std::unordered_map<std::string, APICacheResponse> completedRequests;

  static void graphqlThread(const std::string &query) {
    Archive requestBodyArchive;
    requestBodyArchive.write([&](Archive::Writer &writer) {
      writer.obj("variables", [&]() {
      });

      writer.str("query", query);
    });
    std::string requestBody = requestBodyArchive.toJson();

    // TODO: error handling
    CastleAPI::postRequest(requestBody, [=](bool success, std::string error, std::string result) {
      completedRequests[query] = APICacheResponse(success, error, result);
    });
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
        [=](APIResponse &response) {
        },
        false);
  }

  static void preloadNextCards(const std::string &cardId) {
    graphql(
        "{\n  card(cardId: \"" + cardId
            + "\") {\n    nextCards {\n      cardId\n      sceneDataString\n    }\n  }\n}\n",
        [=](APIResponse &response) {
          if (response.success) {
            auto &reader = response.reader;
            reader.obj("data", [&]() {
              reader.obj("card", [&]() {
                reader.each("nextCards", [&]() {
                  std::string cardId = reader.str("cardId", "");
                  std::string sceneDataString = reader.str("sceneDataString", "");

                  cachedCards[cardId] = APICacheResponse(true, "", sceneDataString);
                });
              });
            });
          }
        },
        false);
  }

  static void loadCard(const std::string &cardId, bool useCache,
      const std::function<void(APIResponse &)> &snapshotCallback) {
    if (cachedCards.find(cardId) != cachedCards.end()) {
      if (cachedCards[cardId].success) {
        auto archive = Archive::fromJson(cachedCards[cardId].result.c_str());
        archive.read([&](Reader &reader) {
          reader.obj("snapshot", [&]() {
            APIResponse snapshotResponse(true, "", reader);
            snapshotCallback(snapshotResponse);
          });
        });
      } else {
        // cachedCards[cardId] has the error information already, so just use it directly
        cachedCards[cardId].loadAPIResponse(snapshotCallback);
      }
    } else {
      graphql(
          "{\n  card(cardId: \"" + std::string(cardId) + "\") {\n    sceneData\n  }\n}\n",
          [=](APIResponse &response) {
            if (response.success) {
              auto &reader = response.reader;
              reader.obj("data", [&]() {
                reader.obj("card", [&]() {
                  reader.obj("sceneData", [&]() {
                    reader.obj("snapshot", [&]() {
                      APIResponse snapshotResponse(true, "", reader);
                      snapshotCallback(snapshotResponse);
                    });
                  });
                });
              });
            } else {
              // response has the error information already, so just use it directly
              snapshotCallback(response);
            }
          },
          useCache);
    }

    preloadNextCards(cardId);
  }

  static void loadDeck(const std::string &deckId, bool useCache,
      const std::function<void(APIResponse &)> &variablesCallBack,
      const std::function<void(APIResponse &)> &snapshotCallback) {
    graphql(
        deckQuery(deckId),
        [=](APIResponse &response) {
          if (response.success) {
            auto &reader = response.reader;
            reader.obj("data", [&]() {
              reader.obj("deck", [&]() {
                reader.arr("variables", [&]() {
                  APIResponse variablesResponse(true, "", reader);
                  variablesCallBack(variablesResponse);
                });
                reader.obj("initialCard", [&]() {
                  reader.obj("sceneData", [&]() {
                    reader.obj("snapshot", [&]() {
                      APIResponse snapshotResponse(true, "", reader);
                      snapshotCallback(snapshotResponse);
                    });
                  });

                  std::string cardId = reader.str("cardId", "");
                  preloadNextCards(cardId);
                });
              });
            });
          } else {
            // response has the error information already, so just use it directly
            variablesCallBack(response);
            snapshotCallback(response);
          }
        },
        useCache);
  }

  static void graphql(
      const std::string &query, const std::function<void(APIResponse &)> &callback, bool useCache) {
    bool usingCache = false;
    if (useCache) {
      if (cachedResponses.find(query) != cachedResponses.end()) {
        cachedResponses[query].loadAPIResponse(callback);

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

  static void runCallbacks() {
    for (const auto &[query, result] : completedRequests) {
      cacheLock.lock();

      cachedResponses[query] = result;
      auto callbacks = queryToPendingCallbacks[query];
      queryToPendingCallbacks.erase(query);
      cacheLock.unlock();

      for (auto const &callback : callbacks) {
        result.loadAPIResponse(callback);
      }
    }

    completedRequests.clear();
  }
};
