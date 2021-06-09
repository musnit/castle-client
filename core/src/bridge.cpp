#include "bridge.h"


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
