#include "bridge.h"


namespace CastleCore {
void sendEventToJS(const char *eventJson);
#if __ANDROID__
void sendEventToJS(const char *eventJson) {
  // TODO: Implement using JNI on Android
}
#endif
}

void Bridge::sendEventToJS(const char *eventJson) {
#ifndef __EMSCRIPTEN__
  CastleCore::sendEventToJS(eventJson);
#endif
}

void Bridge::receiveEvent(const char *eventJson) {
  auto archive = Archive::fromJson(eventJson);
  archive.read([&](Reader &reader) {
    if (auto name = reader.str("name")) {
      auto nameHash = entt::hashed_string(*name).value();
      for (auto &entry : receiverEntries) {
        if (nameHash == entry.nameHs.value() && !std::strcmp(*name, entry.nameHs.data())) {
          entry.receive(engine, reader);
        }
      }
    }
  });
}
