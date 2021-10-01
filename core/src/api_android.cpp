#if __ANDROID__

#include "api.h"
#include <jni.h>


namespace CastleAPI {
void postRequest(const std::string &body, const std::function<void(bool, std::string, std::string)>
        callback) {
  JNIEnv *oldEnv = (JNIEnv *)SDL_AndroidGetJNIEnv();
  JavaVM *jvm;
  oldEnv->GetJavaVM(&jvm);

  JNIEnv *env;
  jvm->AttachCurrentThread(&env, NULL);

  jclass activity = env->FindClass("xyz/castle/api/API");

  jmethodID methodHandle = env->GetStaticMethodID(
      activity, "jniPostRequest", "(Ljava/lang/String;)Ljava/lang/String;");

  jstring bodyJString = env->NewStringUTF(body.c_str());
  jstring resultJString = (jstring)env->CallStaticObjectMethod(activity, methodHandle, bodyJString);
  const char *utf = env->GetStringUTFChars(resultJString, 0);
  std::string result;
  if (utf) {
    result = std::string(utf);
    env->ReleaseStringUTFChars(resultJString, utf);
  }

  env->DeleteLocalRef(resultJString);
  env->DeleteLocalRef(activity);

  callback(true, "", result);
}
}

#endif
