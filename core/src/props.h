#pragma once

// No `#include "precomp.h"` so we can use this in Ghost

#include "entt/core/hashed_string.hpp"

#include "token_map.h"


struct PropAttribs {
  // Attributes that can be attached to props

#define ATTRIB(type, name, default)                                                                \
  type name##_ = default;                                                                          \
  constexpr PropAttribs &name(type value) {                                                        \
    name##_ = value;                                                                               \
    return *this;                                                                                  \
  }

  ATTRIB(bool, rulesGet, true);
  ATTRIB(bool, rulesSet, true);
  ATTRIB(const char *, label, "");
  ATTRIB(float, min, std::numeric_limits<float>::min());
  ATTRIB(float, max, std::numeric_limits<float>::max());

  static constexpr auto maxNumAllowedValues = 16;
  const char *allowedValues_[maxNumAllowedValues] = { nullptr };
  template<typename... Args>
  constexpr PropAttribs &allowedValues(Args... args) {
    auto i = 0;
    const auto visit = [&](const char *value) {
      if (i < maxNumAllowedValues) {
        allowedValues_[i++] = value;
      }
    };
    (visit(args), ...);
    return *this;
  }

#undef ATTRIB
};


// Id system for props. Use `Props::getId(someString)` to get a `PropId` for that string. You can
// then do fast comparisons against the `.id` of a prop, avoiding string comparisons. This is used
// in behavior set / get rules for example -- the rule element saves the id upfront, which can be
// used by the behavior setter or getter when visiting props to compare.

namespace Props {
namespace Internal {
  struct IdValue {}; // Just a marker type to make `IdMap` distinct from other `TokenMap`s
  using IdMap = TokenMap<IdValue>;
}
using PropId = Internal::IdMap::Token;

inline Internal::IdMap ids;

inline PropId getId(const char *str) {
  return ids.getToken(str);
}

inline const std::string *getName(PropId propId) {
  return ids.getString(propId);
}
}
using PropId = Props::PropId;

template<typename Value, typename Internal>
struct Prop {
  // Tracks a prop's value, name and attributes. This type is usually not meant to be instantiated
  // directly, with normal use being through the `PROP` macro.
  //
  // The name is a compile time constant, and the hash of the name is also computed at compile time.
  // This helps with fast lookups.

  template<typename Value_ = Value,
      typename std::enable_if<!std::is_aggregate_v<Value_>, int>::type = 0, typename... Args>
  Prop(Args &&...args) // NOLINT(google-explicit-constructor)
      : value(std::forward<Args>(args)...) {
  }

  template<typename Value_ = Value,
      typename std::enable_if<std::is_aggregate_v<Value_>, int>::type = 0, typename... Args>
  Prop(Args &&...args) // NOLINT(google-explicit-constructor)
      : value { std::forward<Args>(args)... } {
  }

  Value &operator()() {
    return value;
  }

  const Value &operator()() const {
    return value;
  }

  // TODO: cache
  std::string getType() {
    std::string rawType = typeid(Value).name();
    if (rawType.find("vector") != std::string::npos) {
      // TODO: something better here with underlying type
      return "vector";
    }
    if (rawType.find("string") != std::string::npos) {
      return "string";
    }
    if (rawType.find("Variable") != std::string::npos) {
      return "variable";
    }
    if (rawType.find("Tag") != std::string::npos) {
      return "tag";
    }
    if (rawType.find("Expression") != std::string::npos) {
      // TODO: distinguish between expression types, when we have non-numeric exprs
      return "expression";
    }
    if (rawType.find("Props") != std::string::npos) {
      return "property";
    }
    return rawType;
  }

  static constexpr std::string_view name = Internal::name;
  static constexpr uint32_t nameHash = entt::hashed_string(name.data()).value();
  static constexpr const PropAttribs &attribs = Internal::attribs;
  inline static const PropId id = Props::getId(name.data());

private:
  Value value;
};


// Macro for defining a reflectable prop in a struct. Examples:
//
//   struct Foo {
//     PROP(int, health) = 32;              // `int` prop named `health` with default value `32`
//     PROP(std::vector<int>, vec);         // No default value, invokes default constructor (empty)
//     PROP(std::string, space) = "place";
//     PROP((std::pair<int, int>), aPair) = { 1, 2 };    // Need extra parens if the type has commas
//
//     int nope = 42;                       // This is a regular untracked field
//   };
//
// The result is a member with that name of type `Prop<type, someInternals>`. You can then use the
// members of that type to query information about the prop. To continue with the `Foo` example from
// above:
//
//   Foo thing;
//   Debug::log("{} is: {}", thing.health.name, thing.health());
//   thing.aPair().first = 7;
//
// `PROP_NAMED` can be used to explicitly specify a different name string for reflection. This is
// useful if the string desired collides with a C++ keyword. An example from `IfResponse::Params`:
//
//   PROP_NAMED("else", ResponseRef, else_) = nullptr;

#define PROP(type, name_, ...) PROP_NAMED(#name_, type, name_, __VA_ARGS__)
#define PROP_NAMED(nameStr, type, name_, ...)                                                      \
private:                                                                                           \
  struct INTERNAL_##name_ {                                                                        \
    static constexpr std::string_view name = nameStr;                                              \
    static constexpr PropAttribs attribs = PropAttribs().label(name.data()) __VA_ARGS__;           \
  };                                                                                               \
                                                                                                   \
public:                                                                                            \
  Prop<PROP_PARENS_1(PROP_PARENS_3 type), INTERNAL_##name_> name_
#define PROP_PARENS_1(...) PROP_PARENS_2(__VA_ARGS__)
#define PROP_PARENS_2(...) NO##__VA_ARGS__
#define PROP_PARENS_3(...) PROP_PARENS_3 __VA_ARGS__
#define NOPROP_PARENS_3


namespace Props {

// Whether `T` is itself a prop or a (possibly const) reference to one

template<typename T>
inline constexpr auto isProp = false;
template<typename... Params>
inline constexpr auto isProp<Prop<Params...>> = true;
template<typename... Params>
inline constexpr auto isProp<Prop<Params...> &> = true;
template<typename... Params>
inline constexpr auto isProp<const Prop<Params...> &> = true;


// Whether we can reflect `T` to look for fields inside

template<typename T>
inline constexpr auto isReflectable = std::is_aggregate_v<T> && !std::is_polymorphic_v<T>;
template<typename T>
inline constexpr auto isReflectable<T &> = isReflectable<T>;
template<typename T>
inline constexpr auto isReflectable<const T &> = isReflectable<T>;


// Get a tuple of references to fields (whether prop or not) of a reflectable. From:
// https://github.com/felixguendling/cista/tree/83c760166dd8dc069ad939143011e0921ccb5acd/include/cista/reflection

struct CanConvertToAnything {
  template<typename Type>
  operator Type() const; // NOLINT(google-explicit-constructor)
};

template<typename Aggregate, typename IndexSequence = std::index_sequence<>, typename = void>
struct countReflectableFieldsImpl : IndexSequence {};

template<typename Aggregate, size_t... Indices>
struct countReflectableFieldsImpl<Aggregate, std::index_sequence<Indices...>,
    std::void_t<decltype(
        Aggregate { (static_cast<void>(Indices), std::declval<CanConvertToAnything>())...,
            std::declval<CanConvertToAnything>() })>>
    : countReflectableFieldsImpl<Aggregate, std::index_sequence<Indices..., sizeof...(Indices)>> {};

template<typename T>
constexpr size_t countReflectableFields() {
  return countReflectableFieldsImpl<std::remove_cv_t<std::remove_reference_t<T>>>().size();
}

template<typename T>
auto reflectableToTuple(T &val) {
  constexpr auto n = countReflectableFields<T>();
  static_assert(n <= 24, "reflectableToTuple: only up to 24 fields supported");
  if constexpr (n == 0) {
    return std::tie();
  } else if constexpr (n == 1) {
    auto &[a] = val;
    return std::tie(a);
  } else if constexpr (n == 2) {
    auto &[a, b] = val;
    return std::tie(a, b);
  } else if constexpr (n == 3) {
    auto &[a, b, c] = val;
    return std::tie(a, b, c);
  } else if constexpr (n == 4) {
    auto &[a, b, c, d] = val;
    return std::tie(a, b, c, d);
  } else if constexpr (n == 5) {
    auto &[a, b, c, d, e] = val;
    return std::tie(a, b, c, d, e);
  } else if constexpr (n == 6) {
    auto &[a, b, c, d, e, f] = val;
    return std::tie(a, b, c, d, e, f);
  } else if constexpr (n == 7) {
    auto &[a, b, c, d, e, f, g] = val;
    return std::tie(a, b, c, d, e, f, g);
  } else if constexpr (n == 8) {
    auto &[a, b, c, d, e, f, g, h] = val;
    return std::tie(a, b, c, d, e, f, g, h);
  } else if constexpr (n == 9) {
    auto &[a, b, c, d, e, f, g, h, i] = val;
    return std::tie(a, b, c, d, e, f, g, h, i);
  } else if constexpr (n == 10) {
    auto &[a, b, c, d, e, f, g, h, i, j] = val;
    return std::tie(a, b, c, d, e, f, g, h, i, j);
  } else if constexpr (n == 11) {
    auto &[a, b, c, d, e, f, g, h, i, j, k] = val;
    return std::tie(a, b, c, d, e, f, g, h, i, j, k);
  } else if constexpr (n == 12) {
    auto &[a, b, c, d, e, f, g, h, i, j, k, l] = val;
    return std::tie(a, b, c, d, e, f, g, h, i, j, k, l);
  } else if constexpr (n == 13) {
    auto &[a, b, c, d, e, f, g, h, i, j, k, l, m] = val;
    return std::tie(a, b, c, d, e, f, g, h, i, j, k, l, m);
  } else if constexpr (n == 14) {
    auto &[a, b, c, d, e, f, g, h, i, j, k, l, m, n] = val;
    return std::tie(a, b, c, d, e, f, g, h, i, j, k, l, m, n);
  } else if constexpr (n == 15) {
    auto &[a, b, c, d, e, f, g, h, i, j, k, l, m, n, o] = val;
    return std::tie(a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
  } else if constexpr (n == 16) {
    auto &[a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p] = val;
    return std::tie(a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
  } else if constexpr (n == 17) {
    auto &[a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q] = val;
    return std::tie(a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
  } else if constexpr (n == 18) {
    auto &[a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, r] = val;
    return std::tie(a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, r);
  } else if constexpr (n == 19) {
    auto &[a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, r, s] = val;
    return std::tie(a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, r, s);
  } else if constexpr (n == 20) {
    auto &[a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, r, s, t] = val;
    return std::tie(a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, r, s, t);
  } else if constexpr (n == 21) {
    auto &[a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, r, s, t, u] = val;
    return std::tie(a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, r, s, t, u);
  } else if constexpr (n == 22) {
    auto &[a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, r, s, t, u, v] = val;
    return std::tie(a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, r, s, t, u, v);
  } else if constexpr (n == 23) {
    auto &[a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, r, s, t, u, v, w] = val;
    return std::tie(a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, r, s, t, u, v, w);
  } else if constexpr (n == 24) {
    auto &[a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, r, s, t, u, v, w, x] = val;
    return std::tie(a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, r, s, t, u, v, w, x);
  }
}


// Whether `T` has at least one prop member

template<typename T = int, typename... Vs>
inline constexpr auto isAnyProp = isProp<T> || isAnyProp<Vs...>;
template<typename T>
inline constexpr auto isAnyProp<T> = isProp<T>;
template<typename T>
inline constexpr auto isAnyTupleElementProp = false;
template<typename... Ts>
inline constexpr auto isAnyTupleElementProp<std::tuple<Ts...>> = isAnyProp<Ts...>;
template<typename T>
constexpr auto hasProps
    = isReflectable<T> &&isAnyTupleElementProp<decltype(reflectableToTuple(std::declval<T &>()))>;


// Iterate through all the props of a struct. This expands to all the props at compile time, with
// the function `F` being invoked with each prop (of type `Prop<...>`).
//
// For example, the following code prints each prop name and value in a struct. Here `prop()` (the
// value of the prop) has different types on each 'iteration', depending on which prop is being
// referenced:
//
//   Props::forEach(aStruct, [&](auto &prop) {
//     Debug::log("{}: {}", prop.name, prop());    // Print each prop name and value
//   })

template<typename T, typename F>
void forEach(T &val, F &&func) {
  static_assert(isReflectable<T>, "forEachProp: this type is not reflectable");
  if constexpr (hasProps<T>) {
    const auto C = [&](auto &field) {
      if constexpr (isProp<decltype(field)>) {
        func(field);
      }
    };
    constexpr auto n = countReflectableFields<T>();
    static_assert(n <= 24, "forEachProp: only up to 24 fields supported");
    if constexpr (n == 1) {
      auto &[a] = val;
      (C(a));
    } else if constexpr (n == 2) {
      auto &[a, b] = val;
      (C(a), C(b));
    } else if constexpr (n == 3) {
      auto &[a, b, c] = val;
      (C(a), C(b), C(c));
    } else if constexpr (n == 4) {
      auto &[a, b, c, d] = val;
      (C(a), C(b), C(c), C(d));
    } else if constexpr (n == 5) {
      auto &[a, b, c, d, e] = val;
      (C(a), C(b), C(c), C(d), C(e));
    } else if constexpr (n == 6) {
      auto &[a, b, c, d, e, f] = val;
      (C(a), C(b), C(c), C(d), C(e), C(f));
    } else if constexpr (n == 7) {
      auto &[a, b, c, d, e, f, g] = val;
      (C(a), C(b), C(c), C(d), C(e), C(f), C(g));
    } else if constexpr (n == 8) {
      auto &[a, b, c, d, e, f, g, h] = val;
      (C(a), C(b), C(c), C(d), C(e), C(f), C(g), C(h));
    } else if constexpr (n == 9) {
      auto &[a, b, c, d, e, f, g, h, i] = val;
      (C(a), C(b), C(c), C(d), C(e), C(f), C(g), C(h), C(i));
    } else if constexpr (n == 10) {
      auto &[a, b, c, d, e, f, g, h, i, j] = val;
      (C(a), C(b), C(c), C(d), C(e), C(f), C(g), C(h), C(i), C(j));
    } else if constexpr (n == 11) {
      auto &[a, b, c, d, e, f, g, h, i, j, k] = val;
      (C(a), C(b), C(c), C(d), C(e), C(f), C(g), C(h), C(i), C(j), C(k));
    } else if constexpr (n == 12) {
      auto &[a, b, c, d, e, f, g, h, i, j, k, l] = val;
      (C(a), C(b), C(c), C(d), C(e), C(f), C(g), C(h), C(i), C(j), C(k), C(l));
    } else if constexpr (n == 13) {
      auto &[a, b, c, d, e, f, g, h, i, j, k, l, m] = val;
      (C(a), C(b), C(c), C(d), C(e), C(f), C(g), C(h), C(i), C(j), C(k), C(l), C(m));
    } else if constexpr (n == 14) {
      auto &[a, b, c, d, e, f, g, h, i, j, k, l, m, n] = val;
      (C(a), C(b), C(c), C(d), C(e), C(f), C(g), C(h), C(i), C(j), C(k), C(l), C(m), C(n));
    } else if constexpr (n == 15) {
      auto &[a, b, c, d, e, f, g, h, i, j, k, l, m, n, o] = val;
      (C(a), C(b), C(c), C(d), C(e), C(f), C(g), C(h), C(i), C(j), C(k), C(l), C(m), C(n), C(o));
    } else if constexpr (n == 16) {
      auto &[a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p] = val;
      (C(a), C(b), C(c), C(d), C(e), C(f), C(g), C(h), C(i), C(j), C(k), C(l), C(m), C(n), C(o),
          C(p));
    } else if constexpr (n == 17) {
      auto &[a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q] = val;
      (C(a), C(b), C(c), C(d), C(e), C(f), C(g), C(h), C(i), C(j), C(k), C(l), C(m), C(n), C(o),
          C(p), C(q));
    } else if constexpr (n == 18) {
      auto &[a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, r] = val;
      (C(a), C(b), C(c), C(d), C(e), C(f), C(g), C(h), C(i), C(j), C(k), C(l), C(m), C(n), C(o),
          C(p), C(q), C(r));
    } else if constexpr (n == 19) {
      auto &[a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, r, s] = val;
      (C(a), C(b), C(c), C(d), C(e), C(f), C(g), C(h), C(i), C(j), C(k), C(l), C(m), C(n), C(o),
          C(p), C(q), C(r), C(s));
    } else if constexpr (n == 20) {
      auto &[a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, r, s, t] = val;
      (C(a), C(b), C(c), C(d), C(e), C(f), C(g), C(h), C(i), C(j), C(k), C(l), C(m), C(n), C(o),
          C(p), C(q), C(r), C(s), C(t));
    } else if constexpr (n == 21) {
      auto &[a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, r, s, t, u] = val;
      (C(a), C(b), C(c), C(d), C(e), C(f), C(g), C(h), C(i), C(j), C(k), C(l), C(m), C(n), C(o),
          C(p), C(q), C(r), C(s), C(t), C(u));
    } else if constexpr (n == 22) {
      auto &[a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, r, s, t, u, v] = val;
      (C(a), C(b), C(c), C(d), C(e), C(f), C(g), C(h), C(i), C(j), C(k), C(l), C(m), C(n), C(o),
          C(p), C(q), C(r), C(s), C(t), C(u), C(v));
    } else if constexpr (n == 23) {
      auto &[a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, r, s, t, u, v, w] = val;
      (C(a), C(b), C(c), C(d), C(e), C(f), C(g), C(h), C(i), C(j), C(k), C(l), C(m), C(n), C(o),
          C(p), C(q), C(r), C(s), C(t), C(u), C(v), C(w));
    } else if constexpr (n == 24) {
      auto &[a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, r, s, t, u, v, w, x] = val;
      (C(a), C(b), C(c), C(d), C(e), C(f), C(g), C(h), C(i), C(j), C(k), C(l), C(m), C(n), C(o),
          C(p), C(q), C(r), C(s), C(t), C(u), C(v), C(w), C(x));
    }
  }
}

}
