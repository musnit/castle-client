#pragma once

#include "precomp.h"

#include "archive.h"
#include "lv.h"
#include "gesture.h"
#include "bridge.h"

class CoreView {
public:
  enum TouchEvent {
    Down,
    Up,
    Tap,
  };

  virtual void read(Reader &reader) = 0;
  virtual void render() = 0;
  virtual void handleTouch(TouchEvent touch) {};
  virtual void update(double dt) {
  }

  void baseRead(Reader &reader);
  void baseRender();
  void baseHandleTouch(TouchEvent touch);

  double x, y, width, height;
  std::optional<std::string> onTapHandlerId;
  std::optional<std::string> id;
  std::vector<std::shared_ptr<CoreView>> children;
  Lv &lv { Lv::getInstance() };
  bool hasBackgroundColor = false;
  float backgroundColor[3];
  bool isTouchDown = false;
  float borderRadius = -1;
  inline static std::unique_ptr<love::Shader> borderRadiusShader = nullptr;
};

class CoreViewRenderer {
public:
  CoreViewRenderer(
      Bridge &bridge_, std::string layoutTemplateName_, std::shared_ptr<CoreView> layout_)
      : bridge(bridge_)
      , layoutTemplateName(layoutTemplateName_)
      , layout(layout_) {
  }

  void update(double dt);
  void handleGesture(Gesture &gesture);
  void render();

private:
  void renderView(std::shared_ptr<CoreView> view);

  Bridge &bridge;
  std::shared_ptr<CoreView> layout;
  int jsonVersion = 0;
  std::string layoutTemplateName;
  std::optional<std::shared_ptr<CoreView>> touchView;
  bool isTouchOverView = false;
  Lv &lv { Lv::getInstance() };
  mutable love::Transform viewTransform;

  std::optional<std::shared_ptr<CoreView>> getViewAtPoint(
      std::shared_ptr<CoreView> root, float x, float y);
};

class CoreViews {
public:
  CoreViews(const CoreViews &) = delete; // Prevent accidental copies
  const CoreViews &operator=(const CoreViews &) = delete;

  CoreViews(Bridge &bridge);

  static CoreViews &getInstance();

  void setJson(std::string json);

  std::shared_ptr<CoreViewRenderer> getRenderer(std::string layoutTemplateName);

  static void hexToRGBFloat(std::string hex, float *out);

private:
  friend class CoreViewRenderer;
  friend class CoreView;

  CoreViews &lv { *this };

  Bridge &bridge;

  std::string jsonString;

  int jsonVersion = 0;

  std::shared_ptr<CoreView> getView(std::string layoutTemplateName);

  std::shared_ptr<CoreView> readViewFromJson(Reader &reader);

  std::shared_ptr<CoreView> getViewForType(std::string viewType);

  inline static CoreViews *instance = nullptr;
};

inline CoreViews &CoreViews::getInstance() {
  return *instance;
}
