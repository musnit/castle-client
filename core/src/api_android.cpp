#if __ANDROID__

#include "api.h"
#include <jni.h>

namespace CastleAPI {

static int requestId = 0;
static std::map<int, const std::function<void(bool, std::string, std::string)>> activeRequests;

void graphqlPostRequest(
    const std::string &body, const std::function<void(bool, std::string, std::string)> callback) {
  JNIEnv *oldEnv = (JNIEnv *)SDL_AndroidGetJNIEnv();
  JavaVM *jvm;
  oldEnv->GetJavaVM(&jvm);

  JNIEnv *env;
  jvm->AttachCurrentThread(&env, NULL);

  jclass activity = env->FindClass("xyz/castle/api/API");

  jmethodID methodHandle
      = env->GetStaticMethodID(activity, "jniGraphqlPostRequest", "(Ljava/lang/String;I)V");

  jstring bodyJString = env->NewStringUTF(body.c_str());
  int currentRequestId = requestId++;
  activeRequests.insert(std::pair<int, const std::function<void(bool, std::string, std::string)>>(
      currentRequestId, callback));
  env->CallStaticVoidMethod(activity, methodHandle, bodyJString, currentRequestId);

  env->DeleteLocalRef(activity);
}

void getRequest(
    const std::string &url, const std::function<void(bool, std::string, std::string)> callback) {
  JNIEnv *oldEnv = (JNIEnv *)SDL_AndroidGetJNIEnv();
  JavaVM *jvm;
  oldEnv->GetJavaVM(&jvm);

  JNIEnv *env;
  jvm->AttachCurrentThread(&env, NULL);

  jclass activity = env->FindClass("xyz/castle/api/API");

  jmethodID methodHandle
      = env->GetStaticMethodID(activity, "jniGetRequest", "(Ljava/lang/String;I)V");

  jstring urlJString = env->NewStringUTF(url.c_str());
  int currentRequestId = requestId++;
  activeRequests.insert(std::pair<int, const std::function<void(bool, std::string, std::string)>>(
      currentRequestId, callback));
  env->CallStaticVoidMethod(activity, methodHandle, urlJString, currentRequestId);

  env->DeleteLocalRef(activity);
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

  if (CastleAPI::activeRequests[requestId]) {
    if (result == "error") {
      CastleAPI::activeRequests[requestId](false, "error", "");
    } else {
      CastleAPI::activeRequests[requestId](true, "", result);
    }

    CastleAPI::activeRequests.erase(requestId);
  }

  // env->DeleteLocalRef(jresultString);
}

#endif
