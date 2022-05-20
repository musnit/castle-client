#include "bridge.h"


#ifdef ANDROID
#include <jni.h>
namespace CastleAPI {
jclass getBridgeModuleClass();
}
#endif

//
// To JS
//

namespace CastleCore {
void sendEventToJS(const char *eventJson); // Implemented in CastleCoreBridge.mm on iOS and at the
                                           // bottom of this file on Android
}

void Bridge::sendEvent(const char *eventJson) {
#ifndef __EMSCRIPTEN__
  CastleCore::sendEventToJS(eventJson);
#endif
}

struct AnalyticsLogEvent {
  PROP(std::string, event);
};

void Bridge::analyticsLogEvent(std::string event) {
  AnalyticsLogEvent ev;
  ev.event = event;
  sendEvent("ANALYTICS_LOG_EVENT", ev);
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


//
// Sentry breadcrumbs
//

void Bridge::SentryBreadcrumb::write(Writer &writer) const {
  writer.str("category", category);
  writer.str("message", message);
  if (level != "info") {
    writer.str("level", level);
  }
}

void Bridge::addSentryBreadcrumb(const SentryBreadcrumb &breadcrumb) {
  sendEvent("SENTRY_BREADCRUMB", breadcrumb);
}


//
// Android implementation
//

#if __ANDROID__

#include <jni.h>

// To JS
namespace CastleCore {
void sendEventToJS(const char *eventJson) {
  auto env = (JNIEnv *)SDL_AndroidGetJNIEnv();
  auto klass = CastleAPI::getBridgeModuleClass();
  auto method = env->GetStaticMethodID(klass, "staticSendEventToJS", "(Ljava/lang/String;)V");
  auto jEventJson = env->NewStringUTF(eventJson);
  env->CallStaticVoidMethod(klass, method, jEventJson);
}
}

// From JS
extern "C" JNIEXPORT void JNICALL Java_ghost_CastleCoreBridgeModule_nativeSendEvent(
    JNIEnv *env, jclass clazz, jstring eventJson) {
  auto nativeEventJson = env->GetStringUTFChars(eventJson, nullptr);
  Bridge::enqueueReceiveEvent(nativeEventJson);
  env->ReleaseStringUTFChars(eventJson, nativeEventJson);
}

#endif