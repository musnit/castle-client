#pragma once

#include "precomp.h"
#include "archive.h"
#include "utils/lru_cache.h"
#include <thread>

namespace CastleAPI {
void graphqlPostRequest(const std::string &body,
    const std::function<void(bool, std::string, std::string)>
        callback); // Implemented in platform-specific files
void getRequest(
    const std::string &url, const std::function<void(bool, std::string, std::string)> callback);
void getDataRequest(const std::string &url,
    const std::function<void(bool, std::string, unsigned char *, unsigned long)> callback);
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

struct APIDataResponse {
  bool success;
  std::string error;
  unsigned char *data;
  unsigned long length;

  APIDataResponse(bool success, std::string error, unsigned char *data, unsigned long length)
      : success(success)
      , error(error)
      , data(data)
      , length(length) {
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
  inline static std::mutex completedRequestsLock;
  // This is shared by graphql and get requests
  inline static std::unordered_map<std::string, std::list<std::function<void(APIResponse &)>>>
      urlToPendingCallbacks;
  inline static std::unordered_map<std::string, std::list<std::function<void(APIDataResponse &)>>>
      urlToPendingDataCallbacks;
  // This is only used for scenedata
  inline static LruCache<std::string, APICacheResponse> cachedResponses { 8 };
  // These are requests that just finished and have pending callbacks. Once the callbacks
  // are handled they'll be moved to cachedResponses
  inline static std::unordered_map<std::string, APICacheResponse> completedRequests;
  inline static std::unordered_map<std::string, APICacheResponse> completedGraphQLRequests;
  inline static std::unordered_map<std::string, APIDataResponse> completedDataRequests;
  inline static std::unordered_map<std::string, std::string> cardIdToSceneDataUrl;

  static void graphqlThread(
      const std::string &query, const std::function<void(APIResponse &)> &callback) {
    Archive requestBodyArchive;
    requestBodyArchive.write([&](Archive::Writer &writer) {
      writer.obj("variables", [&]() {
      });

      writer.str("query", query);
    });
    std::string requestBody = requestBodyArchive.toJson();

    // TODO: error handling
    CastleAPI::graphqlPostRequest(
        requestBody, [=](bool success, std::string error, std::string result) {
          completedRequestsLock.lock();
          completedGraphQLRequests.insert(
              std::make_pair(query, APICacheResponse(success, error, result)));
          completedRequestsLock.unlock();
        });
  }

  static void getDataThread(
      const std::string &url, const std::function<void(APIDataResponse &)> &callback) {
    CastleAPI::getDataRequest(
        url, [=](bool success, std::string error, unsigned char *result, unsigned long length) {
          if (result == nullptr || length == 0) {
            success = false;
          }

          // would be nice to just not free it in the platform specific code, but not confident
          // about getting that to work consistenly on ios
          unsigned char *copy = nullptr;
          if (result && length > 0) {
            copy = (unsigned char *)malloc(length);
            memcpy(copy, result, length);
          }

          completedRequestsLock.lock();
          completedDataRequests.insert(
              std::make_pair(url, APIDataResponse(success, error, copy, length)));
          completedRequestsLock.unlock();
        });
  }

  static void getThread(const std::string &url) {
    // TODO: error handling
    CastleAPI::getRequest(url, [=](bool success, std::string error, std::string result) {
      completedRequestsLock.lock();
      completedRequests.insert(std::make_pair(url, APICacheResponse(success, error, result)));
      completedRequestsLock.unlock();
    });
  }

  static std::string deckQuery(const std::string &deckId) {
    return "{\n  deck(deckId: \"" + deckId
        + "\") {\n    variables\n    initialCard {\n     "
          " cardId\n    sceneDataUrl\n    }\n  }\n}\n";
  }

public:
  static void preloadDeck(const std::string &deckId, const std::string &initialCardId,
      const std::string &initialCardSceneDataUrl) {
    loadDeck(
        deckId, initialCardId.c_str(), initialCardSceneDataUrl.c_str(), true,
        [=](APIResponse &response) {
        },
        [=](APIResponse &response) {
        });
  }

  static void preloadNextCards(const std::string &cardId) {
    graphql("{\n  card(cardId: \"" + cardId
            + "\") {\n    nextCards {\n      cardId\n      sceneDataUrl\n    }\n  }\n}\n",
        [=](APIResponse &response) {
          if (response.success) {
            auto &reader = response.reader;
            reader.obj("data", [&]() {
              reader.obj("card", [&]() {
                reader.each("nextCards", [&]() {
                  std::string cardId = reader.str("cardId", "");
                  std::string sceneDataUrl = reader.str("sceneDataUrl", "");

                  cardIdToSceneDataUrl[cardId] = sceneDataUrl;
                  get(sceneDataUrl, [=](APIResponse &sceneDataResponse) {
                  });
                });
              });
            });
          }
        });
  }

  static void loadSceneData(
      const std::string &sceneDataUrl, const std::function<void(APIResponse &)> &snapshotCallback) {
    get(sceneDataUrl, [=](APIResponse &sceneDataResponse) {
      if (sceneDataResponse.success) {
        auto &sceneDataReader = sceneDataResponse.reader;
        sceneDataReader.obj("snapshot", [&]() {
          APIResponse snapshotResponse(true, "", sceneDataReader);
          snapshotCallback(snapshotResponse);
        });
      } else {
        snapshotCallback(sceneDataResponse);
      }
    });
  }

  static void loadCard(const std::string &cardId, bool useCache,
      const std::function<void(APIResponse &)> &snapshotCallback) {
    if (useCache && cardIdToSceneDataUrl.find(cardId) != cardIdToSceneDataUrl.end()) {
      std::string sceneDataUrl = cardIdToSceneDataUrl[cardId];
      loadSceneData(sceneDataUrl, snapshotCallback);
      preloadNextCards(cardId);
    } else {
      graphql("{\n  card(cardId: \"" + std::string(cardId) + "\") {\n    sceneDataUrl\n  }\n}\n",
          [=](APIResponse &response) {
            if (response.success) {
              auto &reader = response.reader;
              reader.obj("data", [&]() {
                reader.obj("card", [&]() {
                  auto sceneDataUrl = reader.str("sceneDataUrl", "");
                  cardIdToSceneDataUrl[cardId] = sceneDataUrl;
                  loadSceneData(sceneDataUrl, snapshotCallback);
                  preloadNextCards(cardId);
                });
              });
            } else {
              // response has the error information already, so just use it directly
              snapshotCallback(response);
            }
          });
    }
  }

  static void loadDeck(const std::string &deckId, const char *initialCardId,
      const char *initialCardSceneDataUrl, bool useCache,
      const std::function<void(APIResponse &)> &variablesCallback,
      const std::function<void(APIResponse &)> &snapshotCallback) {
    graphql(deckQuery(deckId), [=](APIResponse &response) {
      if (response.success) {
        auto &reader = response.reader;
        reader.obj("data", [&]() {
          reader.obj("deck", [&]() {
            reader.arr("variables", [&]() {
              APIResponse variablesResponse(true, "", reader);
              variablesCallback(variablesResponse);
            });
            reader.obj("initialCard", [&]() {
              auto sceneDataUrl = reader.str("sceneDataUrl", "");
              std::string cardId = reader.str("cardId", "");
              cardIdToSceneDataUrl[cardId] = sceneDataUrl;
              loadSceneData(sceneDataUrl, snapshotCallback);

              preloadNextCards(cardId);
            });
          });
        });
      } else {
        // response has the error information already, so just use it directly
        variablesCallback(response);
        snapshotCallback(response);
      }
    });
  }

  static void graphql(
      const std::string &query, const std::function<void(APIResponse &)> &callback) {
    bool usingCache = false;
    cacheLock.lock();
    if (urlToPendingCallbacks.find(query) != urlToPendingCallbacks.end()) {
      urlToPendingCallbacks[query].push_back(callback);
      usingCache = true;
    }
    cacheLock.unlock();

    if (!usingCache) {
      cacheLock.lock();
      urlToPendingCallbacks.insert({ query, { callback } });

#ifdef __EMSCRIPTEN__
      cacheLock.unlock();
      graphqlThread(query, callback);
#else
      std::thread { &API::graphqlThread, query, callback }.detach();
      cacheLock.unlock();
#endif
    }
  }

  static void getData(
      const std::string &url, const std::function<void(APIDataResponse &)> &callback) {
    bool usingCache = false;
    cacheLock.lock();
    if (urlToPendingDataCallbacks.find(url) != urlToPendingDataCallbacks.end()) {
      urlToPendingDataCallbacks[url].push_back(callback);
      usingCache = true;
    }
    cacheLock.unlock();

    if (!usingCache) {
      cacheLock.lock();
      urlToPendingDataCallbacks.insert({ url, { callback } });

#ifdef __EMSCRIPTEN__
      cacheLock.unlock();
      getDataThread(url, callback);
#else
      std::thread { &API::getDataThread, url, callback }.detach();
      cacheLock.unlock();
#endif
    }
  }

  static void get(const std::string &url, const std::function<void(APIResponse &)> &callback) {
    bool usingCache = false;
    auto cacheResponse = cachedResponses.get(url);
    if (cacheResponse) {
      cacheResponse->loadAPIResponse(callback);

      usingCache = true;
    } else {
      cacheLock.lock();
      if (urlToPendingCallbacks.find(url) != urlToPendingCallbacks.end()) {
        urlToPendingCallbacks[url].push_back(callback);
        usingCache = true;
      }
      cacheLock.unlock();
    }

    if (!usingCache) {
      cacheLock.lock();
      urlToPendingCallbacks.insert({ url, { callback } });

#ifdef __EMSCRIPTEN__
      cacheLock.unlock();
      getThread(url);
#else
      std::thread { &API::getThread, url }.detach();
      cacheLock.unlock();
#endif
    }
  }

  static void runCallbacks() {
    completedRequestsLock.lock();
    for (auto &[url, result] : completedRequests) {
      cacheLock.lock();

      cachedResponses.insert(url, result);
      auto callbacks = urlToPendingCallbacks[url];
      urlToPendingCallbacks.erase(url);
      cacheLock.unlock();

      for (auto const &callback : callbacks) {
        result.loadAPIResponse(callback);
      }
    }
    completedRequests.clear();

    for (auto &[url, result] : completedGraphQLRequests) {
      cacheLock.lock();

      // don't cache graphql requests
      auto callbacks = urlToPendingCallbacks[url];
      urlToPendingCallbacks.erase(url);
      cacheLock.unlock();

      for (auto const &callback : callbacks) {
        result.loadAPIResponse(callback);
      }
    }
    completedGraphQLRequests.clear();

    for (auto &[url, result] : completedDataRequests) {
      cacheLock.lock();

      auto callbacks = urlToPendingDataCallbacks[url];
      urlToPendingDataCallbacks.erase(url);
      cacheLock.unlock();

      for (auto const &callback : callbacks) {
        callback(result);
      }

      if (result.data && result.length > 0) {
        free(result.data);
      }
    }
    completedDataRequests.clear();

    completedRequestsLock.unlock();
  }
};
