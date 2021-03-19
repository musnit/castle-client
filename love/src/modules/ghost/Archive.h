#pragma once

#include "rapidjson/document.h"
#include "rapidjson/istreamwrapper.h"
#include "rapidjson/ostreamwrapper.h"
#include "rapidjson/prettywriter.h"
#include "rapidjson/writer.h"
#include <fstream>

namespace json = rapidjson;

struct Archive {
  Archive(const Archive &) = delete;
  auto operator=(const Archive &) -> Archive & = delete;

  Archive(Archive &&) = default;
  auto operator=(Archive &&) -> Archive & = default;

  Archive() = default;
  ~Archive() = default;


  // From / to buffer

  static auto fromFile(const std::string &path) -> Archive {
	Archive ar;
	std::ifstream ifs(path);
	json::BasicIStreamWrapper isw(ifs);
	ar.root.ParseStream(isw);
	return ar;
  }
	
	static auto fromString(const char *json) -> Archive {
		Archive ar;
		ar.root.Parse(json);
		return ar;
	}

  auto toString() -> std::string {
	json::StringBuffer buffer;
	json::PrettyWriter writer(buffer);
	writer.SetIndent(' ', 2);
	writer.SetFormatOptions(json::kFormatSingleLineArray);
	root.Accept(writer);
	return std::string(buffer.GetString(), buffer.GetLength());
  }

  // Reader interface

  struct Reader {
	auto has(const char *key) -> bool {
	  return cur->IsObject() ? cur->HasMember(key) : false;
	}

	auto size() -> int {
	  return cur->IsArray() ? int(cur->Size()) : 0;
	}

	// Iteration

	template<typename F>
	auto each(F &&f) -> void {
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
	  case json::kObjectType:
		for ([[maybe_unused]] auto &[key, val] : cur->GetObject()) {
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
		  }
		}
		break;
	  default:
		break;
	  }
	}

	template<typename F>
	auto each(const char *key, F &&f) -> void {
	  if (cur->IsObject()) {
		if (auto mem = cur->FindMember(key); mem != cur->MemberEnd()) {
		  enter(&mem->value, [&]() {
			each(f);
		  });
		}
	  }
	}

	// By object key

	auto boolean(const char *key, bool def) -> bool {
	  if (cur->IsObject()) {
		if (auto mem = cur->FindMember(key); mem != cur->MemberEnd() && mem->value.IsBool()) {
		  return mem->value.GetBool();
		}
	  }
	  return def;
	}

	auto boolean(const char *key) -> std::optional<bool> {
	  if (cur->IsObject()) {
		if (auto mem = cur->FindMember(key); mem != cur->MemberEnd() && mem->value.IsBool()) {
		  return mem->value.GetBool();
		}
	  }
	  return std::nullopt;
	}

	auto num(const char *key, double def) -> double {
	  if (cur->IsObject()) {
		if (auto mem = cur->FindMember(key); mem != cur->MemberEnd() && mem->value.IsNumber()) {
		  return mem->value.GetDouble();
		}
	  }
	  return def;
	}

	auto num(const char *key) -> std::optional<double> {
	  if (cur->IsObject()) {
		if (auto mem = cur->FindMember(key); mem != cur->MemberEnd() && mem->value.IsNumber()) {
		  return mem->value.GetDouble();
		}
	  }
	  return std::nullopt;
	}

	auto str(const char *key, const char *def) -> const char * {
	  if (cur->IsObject()) {
		if (auto mem = cur->FindMember(key); mem != cur->MemberEnd() && mem->value.IsString()) {
		  return mem->value.GetString();
		}
	  }
	  return def;
	}

	auto str(const char *key) -> std::optional<const char *> {
	  if (cur->IsObject()) {
		if (auto mem = cur->FindMember(key); mem != cur->MemberEnd() && mem->value.IsString()) {
		  return mem->value.GetString();
		}
	  }
	  return std::nullopt;
	}

	template<typename F>
	auto arr(const char *key, F &&f) -> void {
	  if (cur->IsObject()) {
		if (auto mem = cur->FindMember(key); mem != cur->MemberEnd() && mem->value.IsArray()) {
			enter(&mem->value, f);
		}
	  }
	}

	template<typename F>
	auto obj(const char *key, F &&f) -> void {
	  if (cur->IsObject()) {
		if (auto mem = cur->FindMember(key); mem != cur->MemberEnd() && mem->value.IsObject()) {
		  enter(&mem->value, f);
		}
	  }
	}

	// By array index

	auto boolean(unsigned int i, bool def = false) -> bool {
	  if (cur->IsArray() && i < cur->Size()) {
		auto &val = (*cur)[i];
		if (val.IsBool()) {
		  return val.GetBool();
		}
	  }
	  return def;
	}

	auto num(unsigned int i, double def = 0) -> double {
	  if (cur->IsArray() && i < cur->Size()) {
		auto &val = (*cur)[i];
		if (val.IsNumber()) {
		  return val.GetDouble();
		}
	  }
	  return def;
	}

	auto str(unsigned int i, const char *def = "") -> const char * {
	  if (cur->IsArray() && i < cur->Size()) {
		auto &val = (*cur)[i];
		if (val.IsString()) {
		  return val.GetString();
		}
	  }
	  return def;
	}

	template<typename F>
	auto arr(unsigned int i, F &&f) -> void {
	  if (cur->IsArray() && i < cur->Size()) {
		auto &val = (*cur)[i];
		if (val.IsArray()) {
		  enter(&val, f);
		}
	  }
	}

	template<typename F>
	auto obj(unsigned int i, F &&f) -> void {
	  if (cur->IsArray() && i < cur->Size()) {
		auto &val = (*cur)[i];
		if (val.IsObject()) {
		  enter(&val, f);
		}
	  }
	}

	// Current value

	auto boolean() -> std::optional<bool> {
	  if (cur->IsBool()) {
		return cur->GetBool();
	  }
	  return std::nullopt;
	}

	auto num() -> std::optional<double> {
	  if (cur->IsNumber()) {
		return cur->GetDouble();
	  }
	  return std::nullopt;
	}

	auto str() -> std::optional<const char *> {
	  if (cur->IsString()) {
		return cur->GetString();
	  }
	  return std::nullopt;
	}

  private:
	friend struct Archive;

	const json::Value *cur;

	explicit Reader(const json::Value &cur_)
		: cur(&cur_) {
	}

	template<typename F>
	auto enter(const json::Value *child, F &&f) -> void {
	  auto parent = cur;
	  cur = child;
	  runLambdaOrCallRead(f);
	  cur = parent;
	}
	  
	  
	  template<typename F>
	auto runLambdaOrCallRead(F &&f) -> void {
		  if constexpr (std::is_invocable<F>::value) {
			f();
		  } else {
			f.read(*this);
		  }
	  }
  };

private:
  inline static const json::Value emptyValue = json::Value(json::kObjectType);

public:
  inline static Reader empty = Reader(emptyValue);

  template<typename F>
  auto read(F &&f) const -> void {
	if (root.IsObject()) {
	  Reader r(root);
	  f(r);
	}
  }


  // Writer interface

  struct Writer {
	template<typename K>
	auto boolean(K &&key, bool val) -> void {
	  cur->AddMember(makeStr(std::forward<K>(key)), json::Value(val), alloc);
	}

	auto boolean(bool val) -> void {
	  cur->PushBack(val, alloc);
	}

	template<typename K>
	auto num(K &&key, int val) -> void {
	  cur->AddMember(makeStr(std::forward<K>(key)), json::Value(val), alloc);
	}

	auto num(int val) -> void {
	  cur->PushBack(val, alloc);
	}

	template<typename K>
	auto num(K &&key, double val) -> void {
	  cur->AddMember(makeStr(std::forward<K>(key)), json::Value(val), alloc);
	}

	auto num(double val) -> void {
	  cur->PushBack(val, alloc);
	}

	template<typename K, typename V>
	auto str(K &&key, V &&val) -> void {
	  cur->AddMember(makeStr(std::forward<K>(key)), makeStr(std::forward<V>(val)), alloc);
	}

	template<typename V>
	auto str(V &&val) -> void {
	  cur->PushBack(makStr(std::forward<V>(val)), alloc);
	}

	template<typename K, typename F>
	auto arr(K &&key, F &&f) -> void {
	  auto parent = cur;
	  auto child = json::Value(json::kArrayType);
	  cur = &child;
		runLambdaOrCallWrite(f);
	  cur = parent;
	  cur->AddMember(makeStr(std::forward<K>(key)), child, alloc);
	}

	template<typename F>
	auto arr(F &&f) -> void {
	  auto parent = cur;
	  auto child = json::Value(json::kArrayType);
	  cur = &child;
		runLambdaOrCallWrite(f);
	  cur = parent;
	  cur->PushBack(child, alloc);
	}

	template<typename K, typename F>
	auto obj(K &&key, F &&f) -> void {
	  auto parent = cur;
	  auto child = json::Value(json::kObjectType);
	  cur = &child;
		runLambdaOrCallWrite(f);
	  cur = parent;
	  cur->AddMember(makeStr(std::forward<K>(key)), child, alloc);
	}

	template<typename F>
	auto obj(F &&f) -> void {
	  auto parent = cur;
	  auto child = json::Value(json::kObjectType);
	  cur = &child;
		runLambdaOrCallWrite(f);
	  cur = parent;
	  cur->PushBack(child, alloc);
	}

  private:
	friend struct Archive;

	json::Value *cur;
	json::Value::AllocatorType &alloc;

	explicit Writer(json::Value &cur_, json::Value::AllocatorType &alloc_)
		: cur(&cur_)
		, alloc(alloc_) {
	}

	template<typename T>
	struct isCStrArray : std::false_type {};
	template<size_t N>
	struct isCStrArray<const char[N]> : std::true_type {};
	template<size_t N>
	struct isCStrArray<const char (&)[N]> : std::true_type {};
	template<size_t N>
	struct isCStrArray<char[N]> : std::true_type {};
	template<size_t N>
	struct isCStrArray<char (&)[N]> : std::true_type {};

	template<typename K>
	auto makeStr(K &&key) -> json::Value {
	  if constexpr (isCStrArray<K>::value) {
		return json::Value(json::Value::StringRefType(std::forward<K>(key)));
	  } else if constexpr (std::is_same_v<std::remove_cv_t<std::remove_reference_t<K>>,
							   std::string>) {
		return std::move(
			json::Value().SetString(key.c_str(), static_cast<unsigned int>(key.size()), alloc));
	  } else {
		return std::move(json::Value().SetString(std::forward<K>(key), alloc));
	  }
	}
	  
	  template<typename F>
	auto runLambdaOrCallWrite(F &&f) -> void {
		  if constexpr (std::is_invocable<F>::value) {
			f();
		  } else {
			f.write(*this);
		  }
	  }
  };

  template<typename F>
  auto write(F &&f) -> void {
	root.SetObject();
	Writer w(root, root.GetAllocator());
	f(w);
  }


private:
  json::Document root;

};
