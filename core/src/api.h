#pragma once

#include "precomp.h"
#include "archive.h"
#include <thread>
#include <curl/curl.h>

class API {
private:
  // https://curl.se/libcurl/c/post-callback.html
  struct CurlReadStruct {
    const char *readptr;
    size_t sizeleft;
  };

  static size_t curlReadCallback(char *dest, size_t size, size_t nmemb, void *userp) {
    struct CurlReadStruct *wt = (struct CurlReadStruct *)userp;
    size_t buffer_size = size * nmemb;

    if (wt->sizeleft) {
      /* copy as much as possible from the source to the destination */
      size_t copy_this_much = wt->sizeleft;
      if (copy_this_much > buffer_size)
        copy_this_much = buffer_size;
      memcpy(dest, wt->readptr, copy_this_much);

      wt->readptr += copy_this_much;
      wt->sizeleft -= copy_this_much;
      return copy_this_much; /* we copied this many bytes */
    }

    return 0; /* no more data left to deliver */
  }

  static size_t curlWriteCallback(void *contents, size_t size, size_t nmemb, std::string *s) {
    size_t newLength = size * nmemb;
    s->append((char *)contents, newLength);
    return newLength;
  }

  template<typename F>
  static void graphqlThread(std::string query, F &&callback) {
    Archive requestBodyArchive;
    requestBodyArchive.write([&](Archive::Writer &writer) {
      writer.obj("variables", [&]() {
      });

      writer.str("query", query);
    });
    std::string requestBody = requestBodyArchive.toJson();

    struct CurlReadStruct wt;

    wt.readptr = requestBody.c_str();
    wt.sizeleft = strlen(requestBody.c_str());

    CURL *curl;
    CURLcode res;

    curl = curl_easy_init();
    bool success = false;
    std::string responseString;
    std::string errorMessage;
    if (curl) {
      // request
      curl_easy_setopt(curl, CURLOPT_URL, "http://api.castle.xyz/graphql");
      curl_easy_setopt(curl, CURLOPT_POST, 1L);
      curl_easy_setopt(curl, CURLOPT_READFUNCTION, curlReadCallback);
      curl_easy_setopt(curl, CURLOPT_READDATA, &wt);
      curl_easy_setopt(curl, CURLOPT_POSTFIELDSIZE, (long)wt.sizeleft);

      struct curl_slist *hs = NULL;
      hs = curl_slist_append(hs, "Content-Type: application/json");
      hs = curl_slist_append(hs, "X-Enable-Scene-Creator-Migrations: true");
      curl_easy_setopt(curl, CURLOPT_HTTPHEADER, hs);

      // response
      curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, curlWriteCallback);
      curl_easy_setopt(curl, CURLOPT_WRITEDATA, &responseString);

      // other
      curl_easy_setopt(curl, CURLOPT_VERBOSE, 1L);

      res = curl_easy_perform(curl);

      if (res == CURLE_OK) {
        success = true;
      } else {
        errorMessage = "curl request failed: " + std::string(curl_easy_strerror(res));
      }

      curl_easy_cleanup(curl);
    } else {
      errorMessage = "curl_easy_init failed";
    }

    if (success) {
      auto archive = Archive::fromJson(responseString.c_str());
      archive.read([&](Reader &reader) {
        callback(true, reader);
      });
    } else {
      auto archive = Archive::fromJson("{}");
      archive.read([&](Reader &reader) {
        callback(false, reader);
      });
    }
  }

public:
  template<typename F>
  static void graphql(std::string query, F &&callback) {
    std::thread { &API::graphqlThread<F>, query, callback }.detach();
  }
};
