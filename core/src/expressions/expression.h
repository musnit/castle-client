#pragma once

#include "precomp.h"

//
// KLUDGE: compiler won't recognize the registration in expressions/*.cpp unless we actually
// define and use a function in those files
//
class ExpressionRegistrar {
public:
  static void registerExpressions();

private:
  static void registerMathExpressions();
  static void registerRandomExpressions();
  static void registerSceneExpressions();
};

inline void ExpressionRegistrar::registerExpressions() {
  registerMathExpressions();
  registerRandomExpressions();
  registerSceneExpressions();
}
