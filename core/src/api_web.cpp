#ifdef __EMSCRIPTEN__

#include "api.h"
#include "js.h"

JS_DEFINE(int, JS_graphqlPostRequest, (int requestId, const char *body, int bodyLen),
    { Castle.graphqlPostRequest(requestId, UTF8ToString(body, bodyLen)); });

JS_DEFINE(int, JS_dataRequest, (int requestId, const char *url, int urlLen),
    { Castle.dataRequest(requestId, UTF8ToString(url, urlLen)); });

namespace CastleAPI {

static int requestId = 0;
static std::map<int, const std::function<void(bool, std::string, std::string)>>
    activeGraphQLPostRequests;
static std::map<int, const std::function<void(bool, std::string, unsigned char *, unsigned long)>>
    activeDataRequests;

void graphqlPostRequest(
    const std::string &body, const std::function<void(bool, std::string, std::string)> callback) {
  int currentRequestId = requestId++;
  activeGraphQLPostRequests.insert(
      std::pair<int, const std::function<void(bool, std::string, std::string)>>(
          currentRequestId, callback));

  JS_graphqlPostRequest(currentRequestId, body.c_str(), body.length());
}

void getRequest(
    const std::string &url, const std::function<void(bool, std::string, std::string)> callback) {
}

void getDataRequest(const std::string &url,
    const std::function<void(bool, std::string, unsigned char *, unsigned long)> callback) {
  int currentRequestId = requestId++;
  activeDataRequests.insert(
      std::pair<int, const std::function<void(bool, std::string, unsigned char *, unsigned long)>>(
          currentRequestId, callback));

  JS_dataRequest(currentRequestId, url.c_str(), url.length());
}
}

extern "C" void jsGraphQLPostRequestComplete(int requestId, int success, char *response) {
  if (CastleAPI::activeGraphQLPostRequests[requestId]) {
    if (success) {
      CastleAPI::activeGraphQLPostRequests[requestId](true, "", response);
    } else {
      CastleAPI::activeGraphQLPostRequests[requestId](false, "error", "");
    }

    CastleAPI::activeGraphQLPostRequests.erase(requestId);
  }
}

extern "C" void jsDataRequestCompleted(
    int requestId, int success, unsigned char *data, int length) {
  if (CastleAPI::activeDataRequests[requestId]) {
    if (success) {
      CastleAPI::activeDataRequests[requestId](true, "", data, (unsigned long)length);
    } else {
      CastleAPI::activeDataRequests[requestId](false, "error", nullptr, 0);
    }

    CastleAPI::activeDataRequests.erase(requestId);
  }
}

#endif
