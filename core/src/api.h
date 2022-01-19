#pragma once

#include "precomp.h"
#include "archive.h"
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

  struct QueuedRequest {
    std::string query;
    const std::function<void(APIResponse &)> callback;

    QueuedRequest(const std::string &query, const std::function<void(APIResponse &)> &callback)
        : query(query)
        , callback(callback) {
    }
  };

  inline static std::mutex cacheLock;
  inline static std::unordered_map<std::string, std::list<std::function<void(APIResponse &)>>>
      urlToPendingCallbacks;
  inline static std::unordered_map<std::string, APICacheResponse> cachedResponses;
  // These are requests that just finished and have pending callbacks. Once the callbacks
  // are handled they'll be moved to cachedResponses
  inline static std::unordered_map<std::string, APICacheResponse> completedRequests;
  inline static std::unordered_map<std::string, std::string> cardIdToSceneDataUrl;
  inline static std::queue<QueuedRequest> requestQueue;
  inline static bool isRunningQueuedRequest = false;

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
          APICacheResponse(success, error, result).loadAPIResponse(callback);
        });
  }

  static void getDataThread(
      const std::string &url, const std::function<void(APIDataResponse &)> &callback) {
    CastleAPI::getDataRequest(
        url, [=](bool success, std::string error, unsigned char *result, unsigned long length) {
          APIDataResponse response(success, error, result, length);
          callback(response);
        });
  }

  static void getThread(const std::string &url) {
    // TODO: error handling
    CastleAPI::getRequest(url, [=](bool success, std::string error, std::string result) {
      completedRequests[url] = APICacheResponse(success, error, result);
    });
  }

  static std::string deckQuery(const std::string &deckId) {
    return "{\n  deck(deckId: \"" + deckId
        + "\") {\n    variables\n    initialCard {\n     "
          " cardId\n    sceneDataUrl\n    }\n  }\n}\n";
  }

public:
  static void preloadDeck(const std::string &deckId, const std::string &variables,
      const std::string &initialCardId, const std::string &initialCardSceneDataUrl) {
    loadDeck(
        deckId, variables.c_str(), initialCardId.c_str(), initialCardSceneDataUrl.c_str(), true,
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

  static void loadDeck(const std::string &deckId, const char *variables, const char *initialCardId,
      const char *initialCardSceneDataUrl, bool useCache,
      const std::function<void(APIResponse &)> &variablesCallback,
      const std::function<void(APIResponse &)> &snapshotCallback) {
    if (variables && initialCardId && initialCardSceneDataUrl) {
      cardIdToSceneDataUrl[initialCardId] = initialCardSceneDataUrl;
      loadSceneData(initialCardSceneDataUrl, snapshotCallback);

      auto archive = Archive::fromJson(variables);
      archive.read([&](Reader &reader) {
        reader.arr("variables", [&]() {
          APIResponse variablesResponse(true, "", reader);
          variablesCallback(variablesResponse);
        });
      });
    } else {
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
  }

  static void runRequestFromQueue() {
    if (isRunningQueuedRequest) {
      return;
    }

    if (requestQueue.empty()) {
      return;
    }

    isRunningQueuedRequest = true;
    auto request = requestQueue.front();
    requestQueue.pop();

    graphql(request.query, [=](APIResponse &response) {
      request.callback(response);
      isRunningQueuedRequest = false;
      runRequestFromQueue();
    });
  }

  static void enqueueGraphQLRequest(
      const std::string &query, const std::function<void(APIResponse &)> &callback) {
    requestQueue.push(QueuedRequest(query, callback));
    runRequestFromQueue();
  }

  static void graphql(
      const std::string &query, const std::function<void(APIResponse &)> &callback) {
#if defined(ANDROID) || defined(__EMSCRIPTEN__)
    graphqlThread(query, callback);
#else
    std::thread { &API::graphqlThread, query, callback }.detach();
#endif
  }

  static void getData(
      const std::string &url, const std::function<void(APIDataResponse &)> &callback) {
#if defined(ANDROID) || defined(__EMSCRIPTEN__)
    cacheLock.unlock();
    getDataThread(url, callback);
#else
    std::thread { &API::getDataThread, url, callback }.detach();
    cacheLock.unlock();
#endif
  }

  static void get(const std::string &url, const std::function<void(APIResponse &)> &callback) {
    bool usingCache = false;
    if (cachedResponses.find(url) != cachedResponses.end()) {
      cachedResponses[url].loadAPIResponse(callback);

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

#if defined(ANDROID) || defined(__EMSCRIPTEN__)
      cacheLock.unlock();
      getThread(url);
#else
      std::thread { &API::getThread, url }.detach();
      cacheLock.unlock();
#endif
    }
  }

  static void runCallbacks() {
    for (auto it = completedRequests.cbegin(); it != completedRequests.cend();) {
      auto url = it->first;
      auto result = it->second;

      cacheLock.lock();

      cachedResponses[url] = result;
      auto callbacks = urlToPendingCallbacks[url];
      urlToPendingCallbacks.erase(url);
      cacheLock.unlock();

      for (auto const &callback : callbacks) {
        result.loadAPIResponse(callback);
      }

      completedRequests.erase(it++);
    }
  }
};
