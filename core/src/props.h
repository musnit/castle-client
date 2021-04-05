#pragma once

// No `#include "precomp.h"` so we can use this in Ghost

#include "entt/core/hashed_string.hpp"

#include <boost/pfr.hpp>


struct PropAttribs {
  // Attributes that can be attached to props. Could include metadata like the UI input style to
  // use, maximum and minimum values, etc. Currently empty.
};


template<typename Value, typename Internal>
struct Prop {
  // Tracks a prop's value, name and attributes. This type is usually not meant to be instantiated
  // directly, with normal use being through the `PROP` macro.
  //
  // The name is a compile time constant, and the hash of the name is also computed at compile time.
  // This helps with fast lookups.

  template<typename Value_ = Value,
      typename std::enable_if<!std::is_aggregate_v<Value_>, int>::type = 0, typename... Args>
  Prop(Args &&...args)
      : value(std::forward<Args>(args)...) {
  }

  template<typename Value_ = Value,
      typename std::enable_if<std::is_aggregate_v<Value_>, int>::type = 0, typename... Args>
  Prop(Args &&...args)
      : value { std::forward<Args>(args)... } {
  }

  Value &operator()() {
    return value;
  }

  const Value &operator()() const {
    return value;
  }

  static constexpr uint32_t nameHash() {
    return nameHs.value();
  }

  static constexpr std::string_view name() {
    return Internal::name;
  }

private:
  Value value;

  inline static const PropAttribs &attribs = Internal::attribs;
  static constexpr auto nameHs = entt::hashed_string(Internal::name.data());
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
//   fmt::print("health is: {}\n", thing.health.value);
//   thing.aPair.value.first = 7;

#define PROP(type, name_, ...)                                                                     \
private:                                                                                           \
  struct INTERNAL_##name_ {                                                                        \
    static constexpr std::string_view name = #name_;                                               \
    inline static PropAttribs attribs = PropAttribs() __VA_ARGS__;                                 \
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


// Whether we can reflect `T` to look for prop members inside

template<typename T>
inline constexpr auto isReflectable = std::is_aggregate_v<std::remove_reference_t<T>>;


// Whether `T` has at least one prop member

namespace Internal {
  template<typename T = int, typename... Vs>
  inline constexpr auto isAnyProp = isProp<T> || isAnyProp<Vs...>;
  template<typename T>
  inline constexpr auto isAnyProp<T> = isProp<T>;
  template<typename T>
  inline constexpr auto isAnyTupleElementProp = false;
  template<typename... Ts>
  inline constexpr auto isAnyTupleElementProp<std::tuple<Ts...>> = isAnyProp<Ts...>;
};
template<typename T>
constexpr auto hasProps
    = (isReflectable<
           T> && Internal::isAnyTupleElementProp<decltype(boost::pfr::structure_to_tuple(std::declval<T>()))>);


// Iterate through all the props of a struct. This expands to all the properties at compile time,
// with the function `F` being invoked with each prop (of type `Prop<...>`).
//
// For example, the following code prints each prop name and value in a struct. Here `prop()` (the
// value of the prop) has different types on each 'iteration', depending on which prop is being
// referenced:
//
//   Props::forEach(aStruct, [&](auto &prop) {
//     fmt::print("{}: {}\n", prop.name(), prop());    // Print each prop name and value
//   })

template<typename Struct, typename F>
void forEach(Struct &&s, F &&f) {
  static_assert(isReflectable<Struct>, "forEach: this type is not reflectable");
  if constexpr (isReflectable<Struct>) {
    boost::pfr::for_each_field(std::forward<Struct>(s), [&](auto &&prop) {
      if constexpr (isProp<decltype(prop)>) {
        f(std::forward<decltype(prop)>(prop));
      }
    });
  }
}

}
