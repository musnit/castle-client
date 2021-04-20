#pragma once

#include "precomp.h"

#include "props.h"


class ExpressionValue {
  // Contains the result of a rule expression, which is dynamically typed. Has methods to check the
  // dynamic type and get the C++ value. Currently the only supported type is `double` for numbers.

public:
  ExpressionValue() = default;
  explicit ExpressionValue(double value_);


  template<typename T>
  bool is(); // Whether the value has type `T`

  template<typename T>
  T as(T def); // Get the value of type `T`, or given default of not of type `T`


private:
  double value = 0;
};


// Inlined implementations

inline ExpressionValue::ExpressionValue(double value_)
    : value(value_) {
}

template<typename T>
bool is() {
  if constexpr (std::is_same_v<double, T>) {
    return true;
  } else {
    return false;
  }
}

template<typename T>
T ExpressionValue::as(T def) {
  if constexpr (std::is_same_v<double, T>) {
    return value;
  } else {
    return def;
  }
}
