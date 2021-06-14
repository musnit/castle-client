#pragma once

#include "precomp.h"

#include "archive.h"


class Engine; // Forward declaration otherwise this would be circular...

class Bridge {
  // Send / receive events to / from JavaScript when the engine is running with React Native

public:
  Bridge(const Bridge &) = delete; // Prevent accidental copies
  const Bridge &operator=(const Bridge &) = delete;

  explicit Bridge(Engine &engine_);


  // Sending events to JavaScript (called from rest of core code)

  template<typename T>
  void sendEvent(const T &event);


  // Receiving events from JavaScript (called from React Native modules)

  void receiveEvent(const char *eventJson);


private:
  Engine &engine;

  template<typename T>
  friend struct BridgeRegistration; // To let it write to entries

  struct ReceiverEntry {
    entt::hashed_string nameHs;
    void (*receive)(Engine &engine, Reader &reader) = nullptr;
  };
  inline static std::vector<ReceiverEntry> receiverEntries;

  void sendEventToJS(const char *eventJson);
};

template<typename T>
struct BridgeRegistration {
  // Registers a bridge event. Must be defined as an `inline static const` member of the type so
  // that registration occurs when the application starts.

  explicit BridgeRegistration(const char *name);

private:
  inline static bool registered = false; // To catch erroneous double-registration of the same type
};


// Inlined implementations

inline Bridge::Bridge(Engine &engine_)
    : engine(engine_) {
}

template<typename T>
void Bridge::sendEvent(const T &event) {
  Archive archive;
  archive.write([&](Archive::Writer &writer) {
    writer.write(event);
  });
  sendEventToJS(archive.toJson().c_str());
}

template<typename T>
BridgeRegistration<T>::BridgeRegistration(const char *name) {
  Bridge::receiverEntries.push_back({
      entt::hashed_string(name),
      [](Engine &engine, Reader &reader) {
        T receiver;
        reader.obj("params", [&]() {
          reader.read(receiver.params);
        });
        receiver.receive(engine);
      },
  });
}
