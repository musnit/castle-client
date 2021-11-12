#ifdef __EMSCRIPTEN__

#include "api.h"

namespace CastleAPI {
void graphqlPostRequest(
    const std::string &body, const std::function<void(bool, std::string, std::string)> callback) {
}

void getRequest(
    const std::string &url, const std::function<void(bool, std::string, std::string)> callback) {
}

void getDataRequest(const std::string &url,
    const std::function<void(bool, std::string, unsigned char *, unsigned long)> callback) {
}
}

#endif
