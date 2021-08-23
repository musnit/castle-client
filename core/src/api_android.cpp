#include "api.h"
#include <jni.h>

#ifdef __ANDROID

std::string API::postRequest(const std::string &body) {
  JNIEnv *oldEnv = (JNIEnv *)SDL_AndroidGetJNIEnv();
  JavaVM *jvm;
  oldEnv->GetJavaVM(&jvm);

  JNIEnv *env;
  jvm->AttachCurrentThread(&env, NULL);

  jclass activity = env->FindClass("xyz/castle/api/API");

  jmethodID methodHandle = env->GetStaticMethodID(
      activity, "jniPostRequest", "(Ljava/lang/String;)Ljava/lang/String;");

  jstring str1 = env->NewStringUTF(body.c_str());
  jstring resultJString = (jstring)env->CallStaticObjectMethod(activity, methodHandle, str1);
  const char *utf = env->GetStringUTFChars(resultJString, 0);
  std::string result;
  if (utf) {
    result = std::string(utf);
    env->ReleaseStringUTFChars(resultJString, utf);
  }

  env->DeleteLocalRef(resultJString);
  env->DeleteLocalRef(activity);

  return result;
}

#endif
