#pragma once

#include "precomp.h"


class Reader; // Forward declarations
class Writer;

class Archive {
  // Stores a JSON document in an in-memory format. Allows traversal of the existing data or
  // overwriting with new data.

public:
  Archive(const Archive &) = delete; // Prevent accidental copies
  Archive &operator=(const Archive &) = delete;
  Archive(Archive &&) = default; // Allow moves
  Archive &operator=(Archive &&) = default;

  Archive() = default;
  ~Archive() = default;


  // From / to JSON

  static Archive fromFile(const char *path);
  static Archive fromJson(const char *json);
  std::string toJson();


  // Read from / write to

  template<typename F>
  void read(F &&f) const;
  template<typename F>
  void write(F &&f);

  using Writer = ::Writer;
  using Reader = ::Reader;


private:
  json::Document root;
};


class Reader {
  // Interface for reading from an `Archive`. Using this interface makes the code somewhat reflect
  // the structure of the JSON it is reading and handle missing values or mismatched types.
  //
  // There is always a 'current' value, which starts at the root of the JSON structure. Sub values
  // of the current value can be entered, which makes that sub value the current. Entering a sub
  // value happens inside a lambda. When the lambda is returned from, the reader is back at the
  // parent value.

public:
  // Constructor

  explicit Reader(const json::Value &cur_); // Read directly out of a RapidJSON value


  // Queries

  bool has(const char *key); // Whether the current object has a given key
  int size(); // Size of the current array


  // Iteration

  // `F` can have the following argument signatures:
  //   `(double)`: Called with each number value in current array or object
  //   `(const char *)`: Called with each string value in current array or object
  //   `()`: Enters each value in current array or object
  //   `(const char *, double)`: Called with each key and number value in current object
  //   `(const char *, const char *)`: Called with each key and string value in current object
  //   `(const char *)`: Called with each key and enters each value in the current object
  template<typename F>
  void each(F &&f); // Iterates the current array / object
  template<typename F>
  void each(const char *key, F &&f); // Iterates the sub-(array / object) at key


  // By key

  // Return named member of given type if found, else given default or empty optional
  bool boolean(const char *key, bool def);
  std::optional<bool> boolean(const char *key);
  double num(const char *key, double def);
  std::optional<double> num(const char *key);
  const char *str(const char *key, const char *def);
  std::optional<const char *> str(const char *key);
  template<typename F>
  void arr(const char *key, F &&f); // Enter the sub-array at key if found
  template<typename F>
  void obj(const char *key, F &&f); // Enter the sub-object at key if found


  // By array index

  // Returned indexed member of given type if exists, else return default
  bool boolean(unsigned int i, bool def);
  double num(unsigned int i, double def);
  const char *str(unsigned int i, const char *def);
  template<typename F>
  void arr(unsigned int i, F &&f); // Enter sub-array at index if exists
  template<typename F>
  void obj(unsigned int i, F &&f); // Enter sub-object at index if exists


  // Current value

  // Returns empty optional if doesn't have requested type
  std::optional<bool> boolean();
  std::optional<double> num();
  std::optional<const char *> str();
  const json::Value *jsonValue(); // Return RapidJSON form of current value


  // Fallback

  // Set current object as inheriting from another one
  void setFallback(const json::Value *fallback_);


private:
  friend class Archive;

  const json::Value *cur;
  const json::Value *fallback;

  template<typename F>
  void enter(const json::Value *child, F &&f);

  json::Value::ConstMemberIterator find(const char *key, bool useFallback = true);
};


class Writer {
  // Interface for writing to an `Archive`. Using this interface makes the code somewhat reflect the
  // structure of the JSON it is generating.
  //
  // Smilar to the reader interface, there is a current value and sub-values can be 'entered'. In
  // the writer case, enterable sub-values are created using the `.arr` or `.obj` methods.

public:
  // These methods all use templates for the string types to cover `const char *`, `std::string` and
  // also `const char [N]`. That last one is the type of constant string literals (like `"hello"`)
  // in C++, and is specialized here to avoid needing to dynamically allocate memory to copy them
  // to. Constant string literals are a pretty common case here `(eg. writer.num("health", 42))`.

  // Insert element at key. The current value must be an object.

  template<typename K>
  void boolean(K &&key, bool val);
  template<typename K>
  void num(K &&key, int val);
  template<typename K>
  void num(K &&key, double val);
  template<typename K, typename V>
  void str(K &&key, V &&val);
  template<typename K, typename F>
  void arr(K &&key, F &&f); // Enter the sub-array once created
  template<typename K, typename F>
  void obj(K &&key, F &&f); // Enter the sub-object once created


  // Add element. The current value must be an array.

  void boolean(bool val);
  void num(int val);
  void num(double val);
  template<typename V>
  void str(V &&val);
  template<typename F>
  void arr(F &&f); // Enter the sub-array once created
  template<typename F>
  void obj(F &&f); // Enter the sub-object once created


private:
  friend class Archive;

  json::Value *cur;
  json::Value::AllocatorType &alloc;

  explicit Writer(json::Value &cur_, json::Value::AllocatorType &alloc_);

  // Detection of string literals
  template<typename T>
  static constexpr auto isCStrArray = false;
  template<size_t N>
  static constexpr auto isCStrArray<const char[N]> = true;
  template<size_t N>
  static constexpr auto isCStrArray<const char (&)[N]> = true;
  template<size_t N>
  static constexpr auto isCStrArray<char[N]> = true;
  template<size_t N>
  static constexpr auto isCStrArray<char (&)[N]> = true;

  template<typename K>
  json::Value makeStr(K &&key);

  template<typename F>
  void runLambdaOrCallWrite(F &&f);
};


// Inlined implementations

inline Archive Archive::fromFile(const char *path) {
  Archive ar;
  std::ifstream ifs(path);
  json::BasicIStreamWrapper isw(ifs);
  ar.root.ParseStream(isw);
  return ar;
}

inline Archive Archive::fromJson(const char *json) {
  Archive ar;
  ar.root.Parse(json);
  return ar;
}

inline std::string Archive::toJson() {
  json::StringBuffer buffer;
  json::PrettyWriter writer(buffer);
  writer.SetIndent(' ', 2);
  writer.SetFormatOptions(json::kFormatSingleLineArray);
  root.Accept(writer);
  return std::string(buffer.GetString(), buffer.GetLength());
}

template<typename F>
void Archive::read(F &&f) const {
  if (root.IsObject()) {
    Reader r(root);
    f(r);
  }
}

template<typename F>
void Archive::write(F &&f) {
  root.SetObject();
  Writer w(root, root.GetAllocator());
  f(w);
}

inline Reader::Reader(const json::Value &cur_)
    : cur(&cur_) {
}

inline bool Reader::has(const char *key) {
  return cur->IsObject() ? cur->HasMember(key) : false;
}

inline int Reader::size() {
  return cur->IsArray() ? int(cur->Size()) : 0;
}

template<typename F>
void Reader::each(F &&f) {
  switch (cur->GetType()) {
  case json::kArrayType:
    for (auto &val : cur->GetArray()) {
      if constexpr (std::is_invocable_v<F, double>) {
        if (val.IsNumber()) {
          f(val.GetDouble());
        }
      } else if constexpr (std::is_invocable_v<F, const char *>) {
        if (val.IsString()) {
          f(val.GetString());
        }
      } else if constexpr (std::is_invocable_v<F>) {
        enter(&val, f);
      }
    }
    break;
  case json::kObjectType: {
    const auto visit = [&](const json::Value &key, const json::Value &val) {
      if constexpr (std::is_invocable_v<F, const char *, double>) {
        if (val.IsNumber()) {
          f(key.GetString(), val.GetDouble());
        }
      } else if constexpr (std::is_invocable_v<F, const char *, const char *>) {
        if (val.IsString()) {
          f(key.GetString(), val.GetString());
        }
      } else if constexpr (std::is_invocable_v<F, const char *>) {
        auto &key_ = key; // Can't capture structured binding... :|
        enter(&val, [&]() {
          f(key_.GetString());
        });
      } else if constexpr (std::is_invocable_v<F, double>) {
        if (val.IsNumber()) {
          f(val.GetDouble());
        }
      } else if constexpr (std::is_invocable_v<F, const char *>) {
        if (val.IsString()) {
          f(val.GetString());
        }
      } else if constexpr (std::is_invocable_v<F>) {
        enter(&val, f);
      }
    };
    for (auto &[key, val] : cur->GetObject()) {
      visit(key, val);
    }
    if (fallback && fallback->IsObject()) {
      for (auto &[key, val] : fallback->GetObject()) {
        if (find(key.GetString(), false) == cur->MemberEnd()) {
          visit(key, val);
        }
      }
    }
  } break;
  default:
    break;
  }
}

template<typename F>
void Reader::each(const char *key, F &&f) {
  if (cur->IsObject()) {
    if (auto mem = find(key); mem != cur->MemberEnd()) {
      enter(&mem->value, [&]() {
        each(f);
      });
    }
  }
}

inline bool Reader::boolean(const char *key, bool def) {
  if (cur->IsObject()) {
    if (auto mem = find(key); mem != cur->MemberEnd() && mem->value.IsBool()) {
      return mem->value.GetBool();
    }
  }
  return def;
}

inline std::optional<bool> Reader::boolean(const char *key) {
  if (cur->IsObject()) {
    if (auto mem = find(key); mem != cur->MemberEnd() && mem->value.IsBool()) {
      *mem;
      return mem->value.GetBool();
    }
  }
  return std::nullopt;
}

inline double Reader::num(const char *key, double def) {
  if (cur->IsObject()) {
    if (auto mem = find(key); mem != cur->MemberEnd() && mem->value.IsNumber()) {
      return mem->value.GetDouble();
    }
  }
  return def;
}

inline std::optional<double> Reader::num(const char *key) {
  if (cur->IsObject()) {
    if (auto mem = find(key); mem != cur->MemberEnd() && mem->value.IsNumber()) {
      return mem->value.GetDouble();
    }
  }
  return std::nullopt;
}

inline const char *Reader::str(const char *key, const char *def) {
  if (cur->IsObject()) {
    if (auto mem = find(key); mem != cur->MemberEnd() && mem->value.IsString()) {
      return mem->value.GetString();
    }
  }
  return def;
}

inline std::optional<const char *> Reader::str(const char *key) {
  if (cur->IsObject()) {
    if (auto mem = find(key); mem != cur->MemberEnd() && mem->value.IsString()) {
      return mem->value.GetString();
    }
  }
  return std::nullopt;
}

template<typename F>
void Reader::arr(const char *key, F &&f) {
  if (cur->IsObject()) {
    if (auto mem = find(key); mem != cur->MemberEnd() && mem->value.IsArray()) {
      enter(&mem->value, f);
    }
  }
}

template<typename F>
void Reader::obj(const char *key, F &&f) {
  if (cur->IsObject()) {
    if (auto mem = find(key); mem != cur->MemberEnd() && mem->value.IsObject()) {
      enter(&mem->value, f);
    }
  }
}

inline bool Reader::boolean(unsigned int i, bool def) {
  if (cur->IsArray() && i < cur->Size()) {
    auto &val = (*cur)[i];
    if (val.IsBool()) {
      return val.GetBool();
    }
  }
  return def;
}

inline double Reader::num(unsigned int i, double def) {
  if (cur->IsArray() && i < cur->Size()) {
    auto &val = (*cur)[i];
    if (val.IsNumber()) {
      return val.GetDouble();
    }
  }
  return def;
}

inline const char *Reader::str(unsigned int i, const char *def) {
  if (cur->IsArray() && i < cur->Size()) {
    auto &val = (*cur)[i];
    if (val.IsString()) {
      return val.GetString();
    }
  }
  return def;
}

template<typename F>
void Reader::arr(unsigned int i, F &&f) {
  if (cur->IsArray() && i < cur->Size()) {
    auto &val = (*cur)[i];
    if (val.IsArray()) {
      enter(&val, f);
    }
  }
}

template<typename F>
void Reader::obj(unsigned int i, F &&f) {
  if (cur->IsArray() && i < cur->Size()) {
    auto &val = (*cur)[i];
    if (val.IsObject()) {
      enter(&val, f);
    }
  }
}

inline std::optional<bool> Reader::boolean() {
  if (cur->IsBool()) {
    return cur->GetBool();
  }
  return std::nullopt;
}

inline std::optional<double> Reader::num() {
  if (cur->IsNumber()) {
    return cur->GetDouble();
  }
  return std::nullopt;
}

inline std::optional<const char *> Reader::str() {
  if (cur->IsString()) {
    return cur->GetString();
  }
  return std::nullopt;
}

inline const json::Value *Reader::jsonValue() {
  return cur;
}

inline void Reader::setFallback(const json::Value *fallback_) {
  if (cur != fallback_) { // Falling back to self doesn't help...
    fallback = fallback_;
  }
}

template<typename F>
void Reader::enter(const json::Value *child, F &&f) {
  auto parent = cur;
  auto parentFallback = fallback;

  cur = child;
  fallback = nullptr;

  if constexpr (std::is_invocable_v<F>) {
    f();
  } else {
    f.read(*this);
  }

  cur = parent;
  fallback = parentFallback;
}

inline json::Value::ConstMemberIterator Reader::find(const char *key, bool useFallback) {
  // TODO(nikki): This gets hit a lot, maybe optimize using a cache of `entt::hashed_string` ->
  //              result pairs (need to save / restore around `enter` above)
  if (auto mem = cur->FindMember(key); mem != cur->MemberEnd()) {
    return mem;
  }
  if (useFallback && fallback) {
    if (auto mem = fallback->FindMember(key); mem != fallback->MemberEnd()) {
      return mem;
    }
  }
  return cur->MemberEnd();
}

template<typename K>
void Writer::boolean(K &&key, bool val) {
  cur->AddMember(makeStr(std::forward<K>(key)), json::Value(val), alloc);
}

inline void Writer::boolean(bool val) {
  cur->PushBack(val, alloc);
}

template<typename K>
void Writer::num(K &&key, int val) {
  cur->AddMember(makeStr(std::forward<K>(key)), json::Value(val), alloc);
}

inline void Writer::num(int val) {
  cur->PushBack(val, alloc);
}

template<typename K>
void Writer::num(K &&key, double val) {
  cur->AddMember(makeStr(std::forward<K>(key)), json::Value(val), alloc);
}

inline void Writer::num(double val) {
  cur->PushBack(val, alloc);
}

template<typename K, typename V>
void Writer::str(K &&key, V &&val) {
  cur->AddMember(makeStr(std::forward<K>(key)), makeStr(std::forward<V>(val)), alloc);
}

template<typename V>
void Writer::str(V &&val) {
  cur->PushBack(makStr(std::forward<V>(val)), alloc);
}

template<typename K, typename F>
void Writer::arr(K &&key, F &&f) {
  auto parent = cur;
  auto child = json::Value(json::kArrayType);
  cur = &child;
  runLambdaOrCallWrite(f);
  cur = parent;
  cur->AddMember(makeStr(std::forward<K>(key)), child, alloc);
}

template<typename F>
void Writer::arr(F &&f) {
  auto parent = cur;
  auto child = json::Value(json::kArrayType);
  cur = &child;
  runLambdaOrCallWrite(f);
  cur = parent;
  cur->PushBack(child, alloc);
}

template<typename K, typename F>
void Writer::obj(K &&key, F &&f) {
  auto parent = cur;
  auto child = json::Value(json::kObjectType);
  cur = &child;
  runLambdaOrCallWrite(f);
  cur = parent;
  cur->AddMember(makeStr(std::forward<K>(key)), child, alloc);
}

template<typename F>
void Writer::obj(F &&f) {
  auto parent = cur;
  auto child = json::Value(json::kObjectType);
  cur = &child;
  runLambdaOrCallWrite(f);
  cur = parent;
  cur->PushBack(child, alloc);
}

inline Writer::Writer(json::Value &cur_, json::Value::AllocatorType &alloc_)
    : cur(&cur_)
    , alloc(alloc_) {
}

template<typename K>
json::Value Writer::makeStr(K &&key) {
  if constexpr (isCStrArray<K>) {
    return json::Value(json::Value::StringRefType(std::forward<K>(key)));
  } else if constexpr (std::is_same_v<std::remove_cv_t<std::remove_reference_t<K>>, std::string>) {
    return std::move(
        json::Value().SetString(key.c_str(), static_cast<unsigned int>(key.size()), alloc));
  } else {
    return std::move(json::Value().SetString(std::forward<K>(key), alloc));
  }
}

template<typename F>
void Writer::runLambdaOrCallWrite(F &&f) {
  if constexpr (std::is_invocable<F>::value) {
    f();
  } else {
    f.write(*this);
  }
}
