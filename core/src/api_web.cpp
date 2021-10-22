#ifdef __EMSCRIPTEN__

#include "api.h"

namespace CastleAPI {
void postRequest(
    const std::string &body, const std::function<void(bool, std::string, std::string)> callback) {
}

void pollForResponses() {
}
}

#endif
