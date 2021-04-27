#pragma once

#include "precomp.h"

#include "props.h"


class ExpressionValue {
  // Contains the result of a rule expression, which is dynamically typed. Has methods to check the
  // dynamic type and get the C++ value. Currently the only supported stored type is `double` for
  // numbers, retrievable as `double`, `float` or `int`.

public:
  ExpressionValue() = default;
  ExpressionValue(double value_); // NOLINT(google-explicit-constructor)


  template<typename T>
  bool is() const; // Whether the current value can be interpreted as C++ type `T`

  template<typename T>
  T as(T def
      = {}) const; // Get the the current value as C++ type `T`, or given default if not `is<T>()`


private:
  double value = 0;
};


// Inlined implementations

inline ExpressionValue::ExpressionValue(double value_)
    : value(value_) {
}

template<typename T>
bool ExpressionValue::is() const {
  if constexpr (std::is_same_v<double, T> || std::is_same_v<float, T> || std::is_same_v<int, T>) {
    return true;
  } else {
    return false;
  }
}

template<typename T>
T ExpressionValue::as(T def) const {
  if constexpr (std::is_same_v<double, T> || std::is_same_v<float, T> || std::is_same_v<int, T>) {
    return value;
  } else {
    return def;
  }
}
