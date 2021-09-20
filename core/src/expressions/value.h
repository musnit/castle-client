#pragma once

#include "precomp.h"
#include "archive.h"

#include "props.h"

class ExpressionValue {
  // Contains the result of a rule expression, which is dynamically typed. Has methods to check the
  // dynamic type and get the C++ value. Currently the supported types are:
  //   `double`, `float`, `int`: all stored internally as `double`
  //   `bool`: also stored as `double`, interpreting `0` as `false` and everything else as `true`
  //   `const char *`: stored as `const char *` -- which means the string is not owned and must
  //                  outlive the value (!!)

public:
  ExpressionValue() = default;
  ExpressionValue(int value_); // Disambiguate `const char *`. NOLINT(google-explicit-constructor)
  ExpressionValue(double value_); // NOLINT(google-explicit-constructor)
  ExpressionValue(const char *value_); // NOLINT(google-explicit-constructor)


  template<typename T>
  bool is() const; // Whether the current value can be interpreted as C++ type `T`

  template<typename T>
  T as(T def = {}) const; // Get the the current value as C++ type `T`, or `def` if not `is<T>()`

  bool operator==(const ExpressionValue &other) const;
  bool operator!=(const ExpressionValue &other) const;

private:
  friend struct ExpressionComparison;

  std::variant<double, const char *> value = 0.0;
};


struct ExpressionComparison {
  ExpressionComparison() = default;

public:
  void read(Reader &reader);
  void write(Writer &writer) const;

  bool compare(const ExpressionValue &lhs, const ExpressionValue &rhs) const;

  enum struct Comparison {
    Equal,
    NotEqual,
    LessOrEqual,
    LessThan,
    GreaterOrEqual,
    GreaterThan,
  };

private:
  Comparison comparison = Comparison::Equal;
};


// Inlined implementations

inline ExpressionValue::ExpressionValue(int value_)
    : value(double(value_)) {
}

inline ExpressionValue::ExpressionValue(double value_)
    : value(value_) {
}

inline ExpressionValue::ExpressionValue(const char *value_)
    : value(value_) {
}

template<typename T>
bool ExpressionValue::is() const {
  if constexpr (std::is_arithmetic_v<T>) {
    return std::holds_alternative<double>(value);
  } else {
    return std::holds_alternative<T>(value);
  }
}

template<typename T>
T ExpressionValue::as(T def) const {
  if constexpr (std::is_arithmetic_v<T>) {
    if (std::holds_alternative<double>(value)) {
      return std::get<double>(value);
    } else {
      return 0;
    }
  } else {
    if (std::holds_alternative<T>(value)) {
      return std::get<T>(value);
    } else {
      return {};
    }
  }
}

inline bool ExpressionValue::operator==(const ExpressionValue &other) const {
  if (std::holds_alternative<const char *>(value)) {
    if (std::holds_alternative<const char *>(other.value)) {
      return !std::strcmp(std::get<const char *>(value), std::get<const char *>(other.value));
    } else {
      return false;
    }
  } else {
    return value == other.value;
  }
}

inline bool ExpressionValue::operator!=(const ExpressionValue &other) const {
  return !(*this == other);
}

inline void ExpressionComparison::read(Reader &reader) {
  if (auto str = reader.str()) {
    auto comparisonStr = std::string(*str);
    switch (comparisonStr[0]) {
    case 'e': { // "equal"
      comparison = Comparison::Equal;
      break;
    }
    case 'n': { // "not equal"
      comparison = Comparison::NotEqual;
      break;
    }
    case 'l': {
      if (comparisonStr[5] == 'o') { // "less or equal"
        comparison = Comparison::LessOrEqual;
      } else { // "less than"
        comparison = Comparison::LessThan;
      }
      break;
    }
    case 'g': {
      if (comparisonStr[8] == 'o') { // "greater or equal"
        comparison = Comparison::GreaterOrEqual;
      } else { // "greater"
        comparison = Comparison::GreaterThan;
      }
      break;
    }
    }
  }
}

inline void ExpressionComparison::write(Writer &writer) const {
  std::string comparisonStr;
  switch (comparison) {
  case Comparison::Equal:
    comparisonStr = "equal";
    break;
  case Comparison::NotEqual:
    comparisonStr = "not equal";
    break;
  case Comparison::LessOrEqual:
    comparisonStr = "less or equal";
    break;
  case Comparison::LessThan:
    comparisonStr = "less than";
    break;
  case Comparison::GreaterOrEqual:
    comparisonStr = "greater or equal";
    break;
  case Comparison::GreaterThan:
    comparisonStr = "greater than";
    break;
  }
  writer.setStr(comparisonStr);
}

inline bool ExpressionComparison::compare(
    const ExpressionValue &lhs, const ExpressionValue &rhs) const {
  if (std::holds_alternative<double>(lhs.value) && std::holds_alternative<double>(rhs.value)) {
    auto lNum = std::get<double>(lhs.value), rNum = std::get<double>(rhs.value);
    switch (comparison) {
    case Comparison::Equal:
      return lNum == rNum;
    case Comparison::NotEqual:
      return lNum != rNum;
    case Comparison::LessOrEqual:
      return lNum <= rNum;
    case Comparison::LessThan:
      return lNum < rNum;
    case Comparison::GreaterOrEqual:
      return lNum >= rNum;
    case Comparison::GreaterThan:
      return lNum > rNum;
    }
  }
  return false;
}
