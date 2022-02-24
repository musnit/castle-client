#if __ANDROID__

#include "api.h"
#include <jni.h>

namespace CastleAPI {

static int requestId = 0;
static std::map<int, const std::function<void(bool, std::string, std::string)>> activeRequests;
static std::map<int, const std::function<void(bool, std::string, unsigned char *, unsigned long)>>
    activeDataRequests;
static std::mutex requestLock;

static jclass apiClass;

JNIEnv *getEnv() {
  return (JNIEnv *)SDL_AndroidGetJNIEnv();
}

void initJNI() {
  auto env = getEnv();
  apiClass = (jclass)env->NewGlobalRef(env->FindClass("xyz/castle/api/API"));
}

void graphqlPostRequest(
    const std::string &body, const std::function<void(bool, std::string, std::string)> callback) {
  JNIEnv *env = getEnv();

  jmethodID methodHandle
      = env->GetStaticMethodID(apiClass, "jniGraphqlPostRequest", "(Ljava/lang/String;I)V");

  jstring bodyJString = env->NewStringUTF(body.c_str());
  int currentRequestId = requestId++;

  requestLock.lock();
  activeRequests.insert(std::pair<int, const std::function<void(bool, std::string, std::string)>>(
      currentRequestId, callback));
  requestLock.unlock();

  env->CallStaticVoidMethod(apiClass, methodHandle, bodyJString, currentRequestId);
}

void getRequest(
    const std::string &url, const std::function<void(bool, std::string, std::string)> callback) {
  JNIEnv *env = getEnv();

  jmethodID methodHandle
      = env->GetStaticMethodID(apiClass, "jniGetRequest", "(Ljava/lang/String;I)V");

  jstring urlJString = env->NewStringUTF(url.c_str());
  int currentRequestId = requestId++;
  requestLock.lock();
  activeRequests.insert(std::pair<int, const std::function<void(bool, std::string, std::string)>>(
      currentRequestId, callback));
  requestLock.unlock();
  env->CallStaticVoidMethod(apiClass, methodHandle, urlJString, currentRequestId);
}

void getDataRequest(const std::string &url,
    const std::function<void(bool, std::string, unsigned char *, unsigned long)> callback) {
  JNIEnv *env = getEnv();

  jmethodID methodHandle
      = env->GetStaticMethodID(apiClass, "jniGetDataRequest", "(Ljava/lang/String;I)V");

  jstring urlJString = env->NewStringUTF(url.c_str());
  int currentRequestId = requestId++;
  requestLock.lock();
  activeDataRequests.insert(
      std::pair<int, const std::function<void(bool, std::string, unsigned char *, unsigned long)>>(
          currentRequestId, callback));
  requestLock.unlock();
  env->CallStaticVoidMethod(apiClass, methodHandle, urlJString, currentRequestId);
}
}

// From JS
extern "C" JNIEXPORT void JNICALL Java_xyz_castle_api_API_networkRequestCompleted(
    JNIEnv *env, jclass clazz, jstring jresultString, jint jrequestId) {
  int requestId = (int)jrequestId;

  const char *utf = env->GetStringUTFChars(jresultString, 0);
  std::string result;
  if (utf) {
    result = std::string(utf);
    env->ReleaseStringUTFChars(jresultString, utf);
  }

  CastleAPI::requestLock.lock();
  if (CastleAPI::activeRequests[requestId]) {
    if (result == "error") {
      auto callback = CastleAPI::activeRequests[requestId];
      CastleAPI::activeRequests.erase(requestId);
      CastleAPI::requestLock.unlock();
      callback(false, "error", "");
    } else {
      auto callback = CastleAPI::activeRequests[requestId];
      CastleAPI::activeRequests.erase(requestId);
      CastleAPI::requestLock.unlock();
      callback(true, "", result);
    }
  } else {
    CastleAPI::requestLock.unlock();
  }

  // env->DeleteLocalRef(jresultString);
}

extern "C" JNIEXPORT void JNICALL Java_xyz_castle_api_API_dataNetworkRequestCompleted(
    JNIEnv *env, jclass clazz, jboolean success, jbyteArray jresultByteArray, jint jrequestId) {
  int requestId = (int)jrequestId;

  CastleAPI::requestLock.lock();
  if (CastleAPI::activeDataRequests[requestId]) {
    if (success) {
      int len = env->GetArrayLength(jresultByteArray);
      unsigned char *buf = new unsigned char[len];
      env->GetByteArrayRegion(jresultByteArray, 0, len, reinterpret_cast<jbyte *>(buf));
      auto callback = CastleAPI::activeDataRequests[requestId];
      CastleAPI::activeDataRequests.erase(requestId);
      CastleAPI::requestLock.unlock();

      callback(true, "", buf, (unsigned long)len);

      delete[] buf;
    } else {
      auto callback = CastleAPI::activeDataRequests[requestId];
      CastleAPI::activeDataRequests.erase(requestId);
      CastleAPI::requestLock.unlock();

      callback(false, "error", nullptr, 0);
    }
  } else {
    CastleAPI::requestLock.unlock();
  }
}

#endif
