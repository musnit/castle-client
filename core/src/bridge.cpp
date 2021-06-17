#include "bridge.h"


//
// To JS
//

namespace CastleCore {
void sendEventToJS(const char *eventJson); // Implemented in CastleCoreBridge.mm on iOS
#if __ANDROID__
void sendEventToJS(const char *eventJson) {
  // TODO: Implement using JNI on Android
}
#endif
}

void Bridge::sendEvent(const char *eventJson) {
#ifndef __EMSCRIPTEN__
  CastleCore::sendEventToJS(eventJson);
#endif
}


//
// From JS
//

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

void Bridge::enqueueReceiveEvent(const char *eventJson) {
  std::scoped_lock lock(receiveQueueMutex);
  receiveQueue.emplace_back(eventJson);
}

void Bridge::flushPendingReceives() {
  decltype(receiveQueue) tempQueue;
  {
    std::scoped_lock lock(receiveQueueMutex);
    receiveQueue.swap(tempQueue);
  }
  for (auto &eventJson : tempQueue) {
    receiveEvent(eventJson.c_str());
  }
}

#if __ANDROID__
#include <jni.h>
extern "C" JNIEXPORT void JNICALL Java_ghost_CastleCoreBridgeModule_nativeSendEvent(
    JNIEnv *env, jclass clazz, jstring eventJson) {
  auto nativeEventJson = env->GetStringUTFChars(eventJson, nullptr);
  Bridge::enqueueReceiveEvent(nativeEventJson);
  env->ReleaseStringUTFChars(eventJson, nativeEventJson);
}
#endif