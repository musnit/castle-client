#pragma once

#include "precomp.h"
#include "archive.h"
#include <thread>

class API {
private:
  static std::string postRequest(std::string);

  template<typename F>
  static void graphqlThread(std::string query, F &&callback) {
    Archive requestBodyArchive;
    requestBodyArchive.write([&](Archive::Writer &writer) {
      writer.obj("variables", [&]() {
      });

      writer.str("query", query);
    });
    std::string requestBody = requestBodyArchive.toJson();

    // TODO: error handling
    std::string result = postRequest(requestBody);

    auto archive = Archive::fromJson(result.c_str());
    archive.read([&](Reader &reader) {
      callback(true, reader);
    });
  }

public:
  template<typename F>
  static void graphql(std::string query, F &&callback) {
    std::thread { &API::graphqlThread<F>, query, callback }.detach();
  }
};
