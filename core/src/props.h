#pragma once

#include "precomp.h"


struct PropAttribs {
  // Attributes that can be attached to props. Could include metadata like the UI input style to
  // use, maximum and minimum values, etc. Currently empty.
};


template<typename Value, typename Internal>
struct Prop {
  // Tracks a property's value, name and attributes. This type is usually not meant to be
  // instantiated directly, with normal use being through the `PROP` macro.
  //
  // The name is a compile time constant, and the hash of the name is also computed at compile time.
  // This helps with fast lookups.

  Value value;

  template<typename Value_ = Value,
      typename std::enable_if<!std::is_aggregate_v<Value_>, int>::type = 0, typename... Args>
  Prop(Args &&... args)
      : value(std::forward<Args>(args)...) {
  }

  template<typename Value_ = Value,
      typename std::enable_if<std::is_aggregate_v<Value_>, int>::type = 0, typename... Args>
  Prop(Args &&... args)
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
    return nameHs.data();
  }

private:
  inline static const PropAttribs &attribs = Internal::attribs;
  static constexpr auto nameHs = entt::hashed_string(Internal::nameStr);
};


// Macro for defining a reflectable property in a struct. Examples:
//
//   struct Foo {
//     PROP(int, health) = 32;              // `int` property named `health` with default value `32`
//     PROP(std::vector<int>, vec);         // No default value, invokes default constructor (empty)
//     PROP(std::string, space) = "place";
//     PROP((std::pair<int, int>), aPair) = { 1, 2 };    // Need extra parens if the type has commas
//
//     int nope = 42;                       // This is a regular untracked field
//   };
//
// The result is a member with that name with type `Prop<...>` (see `Prop` above). You can then use
// the members of that type to query information about the property. To continue with the `Foo`
// example from above:
//
//   Foo thing;
//   fmt::print("health is: {}\n", thing.health.value);
//   thing.aPair.value.first = 7;

#define PROP(type, name, ...)                                                                      \
private:                                                                                           \
  struct INTERNAL_##name {                                                                         \
    static constexpr const char nameStr[] = #name;                                                 \
    inline static PropAttribs attribs = PropAttribs() __VA_ARGS__;                                 \
  };                                                                                               \
                                                                                                   \
public:                                                                                            \
  Prop<PROP_PARENS_1(PROP_PARENS_3 type), INTERNAL_##name> name
#define PROP_PARENS_1(...) PROP_PARENS_2(__VA_ARGS__)
#define PROP_PARENS_2(...) NO##__VA_ARGS__
#define PROP_PARENS_3(...) PROP_PARENS_3 __VA_ARGS__
#define NOPROP_PARENS_3


namespace Props {

// `Props::isProp<T>` is `true` iff. `T` is a `Prop<...>`

template<typename T>
inline constexpr auto isProp = false;
template<typename... Params>
inline constexpr auto isProp<Prop<Params...>> = true;


// Iterate through all the properties (defined with `PROP` above) of a struct. This expands to all
// the properties at compile time, with the function `F` being invoked with each property (of type
// `Prop<...>`). For this to work the struct must not have any private members or constructors.
//
// For example, the following code prints each property name and value in a struct. Here
// `prop.value` has different types on each 'iteration', depending on which property is being
// referenced:
//
//   Props::forEach(aStruct, [&](auto &prop) {
//     fmt::print("{}: {}\n", prop.name(), prop.value);    // Print each property name and value
//   })

template<typename Struct, typename F>
void forEach(Struct &&s, F &&f) {
  boost::pfr::for_each_field(std::forward<Struct>(s), [&](auto &&prop) {
    if constexpr (isProp<std::remove_reference_t<decltype(prop)>>) {
      f(std::forward<decltype(prop)>(prop));
    }
  });
}
}
