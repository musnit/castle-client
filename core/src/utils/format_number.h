#pragma once
#include "precomp.h"

namespace FormatNumber {
std::string round(float value) {
  std::ostringstream ss;
  ss << std::fixed << std::setprecision(1) << value;
  std::string s = ss.str();
  if (s[s.length() - 1] == '0') {
    return s.substr(0, s.length() - 2);
  }
  return s;
}

std::string toString(float value) {
  std::string prefix = value < 0 ? "-" : "";

  value = abs(value);

  std::string unit = "";

  if (value >= 1000000000) {
    unit = "B";
    value /= 1000000000;
  } else if (value >= 1000000) {
    unit = "M";
    value /= 1000000;
  } else if (value >= 1000) {
    unit = "K";
    value /= 1000;
  }

  return prefix + round(value) + unit;
}

bool isInt(const std::string &s) {
  std::string::const_iterator it = s.begin();
  while (it != s.end() && (std::isdigit(*it) || *it == '-'))
    ++it;
  return !s.empty() && it == s.end();
}
}
