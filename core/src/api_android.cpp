#if __ANDROID__

#include "api.h"
#include <jni.h>


namespace CastleAPI {

static int requestId = 0;
static std::map<int, const std::function<void(bool, std::string, std::string)>> activeRequests;

void postRequest(
    const std::string &body, const std::function<void(bool, std::string, std::string)> callback) {
  JNIEnv *oldEnv = (JNIEnv *)SDL_AndroidGetJNIEnv();
  JavaVM *jvm;
  oldEnv->GetJavaVM(&jvm);

  JNIEnv *env;
  jvm->AttachCurrentThread(&env, NULL);

  jclass activity = env->FindClass("xyz/castle/api/API");

  jmethodID methodHandle
      = env->GetStaticMethodID(activity, "jniPostRequest", "(Ljava/lang/String;I)V");

  jstring bodyJString = env->NewStringUTF(body.c_str());
  int currentRequestId = requestId++;
  activeRequests.insert(std::pair<int, const std::function<void(bool, std::string, std::string)>>(
      currentRequestId, callback));
  env->CallStaticVoidMethod(activity, methodHandle, bodyJString, currentRequestId);

  env->DeleteLocalRef(activity);
}

void pollForResponses() {
  JNIEnv *env = (JNIEnv *)SDL_AndroidGetJNIEnv();

  jclass activity = env->FindClass("xyz/castle/api/API");

  jmethodID methodHandle
      = env->GetStaticMethodID(activity, "jniPollForResponses", "()Landroid/util/Pair;");
  jobject jpair = env->CallStaticObjectMethod(activity, methodHandle);
  jclass pairClass = env->FindClass("android/util/Pair");
  jfieldID first = env->GetFieldID(pairClass, "first", "Ljava/lang/Object;");
  jfieldID second = env->GetFieldID(pairClass, "second", "Ljava/lang/Object;");

  jobject jrequestId = env->GetObjectField(jpair, first);
  jstring jresultString = (jstring)env->GetObjectField(jpair, second);

  jclass integerClass = env->FindClass("java/lang/Integer");
  jmethodID intValueMethod = env->GetMethodID(integerClass, "intValue", "()I");
  int requestId = env->CallIntMethod(jrequestId, intValueMethod);

  if (requestId != -1) {
    const char *utf = env->GetStringUTFChars(jresultString, 0);
    std::string result;
    if (utf) {
      result = std::string(utf);
      env->ReleaseStringUTFChars(jresultString, utf);
    }

    if (activeRequests[requestId]) {
      if (result == "error") {
        activeRequests[requestId](false, "error", "");
      } else {
        activeRequests[requestId](true, "", result);
      }

      activeRequests.erase(requestId);
    }
  }

  env->DeleteLocalRef(jresultString);
  env->DeleteLocalRef(activity);
}
}

#endif
