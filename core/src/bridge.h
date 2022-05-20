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
  void sendEvent(const char *name, T &&params);


  // Receiving events from JavaScript (called from React Native modules)

  void receiveEvent(const char *eventJson); // NOTE: Must be called on Engine main loop thread!

  static void enqueueReceiveEvent(const char *eventJson); // Can be called from any thread

  void flushPendingReceives();


  // Sentry breadcrumbs

  struct SentryBreadcrumb {
    std::string category;
    std::string message;
    std::string level = "info"; // "fatal", "error", "warning", "log", "info", "debug" or "critical"

    void write(Writer &writer) const;
  };
  void addSentryBreadcrumb(const SentryBreadcrumb &breadcrumb);

  void analyticsLogEvent(std::string event, std::initializer_list<std::string> properties = {});


private:
  Engine &engine;


  void sendEvent(const char *eventJson);
  int lastEventIdSent = 0;

  template<typename T>
  friend struct BridgeRegistration; // To let it write to entries

  struct ReceiverEntry {
    entt::hashed_string nameHs;
    void (*receive)(Engine &engine, Reader &reader) = nullptr;
  };
  inline static std::vector<ReceiverEntry> receiverEntries;

  inline static std::mutex receiveQueueMutex;
  inline static std::vector<std::string> receiveQueue;
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
void Bridge::sendEvent(const char *name, T &&params) {
  Archive archive;
  archive.write([&](Archive::Writer &writer) {
    writer.str("name", name);
    writer.num("eventId", ++lastEventIdSent);
    writer.obj("params", [&]() {
      if constexpr (std::is_invocable_v<T, Writer &>) {
        params(writer);
      } else {
        writer.write(params);
      }
    });
  });
  sendEvent(archive.toJson().c_str());
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
