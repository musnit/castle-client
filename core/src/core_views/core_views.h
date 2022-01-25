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

  void baseRead(Reader &reader, CoreView *parent,
      std::unordered_map<std::string, std::unordered_map<std::string, std::string>> *props);
  void baseRender();
  void baseHandleTouch(TouchEvent touch);

  double left = 0;
  double top = 0;
  double width = 0;
  double height = 0;
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
  CoreViewRenderer(Bridge &bridge_, std::string layoutTemplateName_,
      std::shared_ptr<CoreView> layout_, int jsonVersion_)
      : bridge(bridge_)
      , layoutTemplateName(layoutTemplateName_)
      , layout(layout_)
      , jsonVersion(jsonVersion_) {
  }

  void update(double dt);
  void handleGesture(Gesture &gesture);
  void render();

  void updateProp(std::string viewId, std::string key, std::string value);

private:
  void renderView(CoreView *view);

  Bridge &bridge;
  std::shared_ptr<CoreView> layout;
  int jsonVersion = 0;
  std::string layoutTemplateName;
  std::optional<CoreView *> touchView;
  bool isTouchOverView = false;
  Lv &lv { Lv::getInstance() };
  mutable love::Transform viewTransform;
  std::unordered_map<std::string, std::unordered_map<std::string, std::string>> props;

  std::optional<CoreView *> getViewForId(CoreView *root, std::string id);
  std::optional<CoreView *> getViewAtPoint(CoreView *root, float x, float y);
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

  float getNumConstant(std::string key);

private:
  friend class CoreViewRenderer;
  friend class CoreView;

  CoreViews &lv { *this };

  Bridge &bridge;

  std::string jsonString;

  int jsonVersion = 0;

  std::shared_ptr<CoreView> getView(std::string layoutTemplateName,
      std::unordered_map<std::string, std::unordered_map<std::string, std::string>> *props);

  std::shared_ptr<CoreView> readViewFromJson(Reader &reader, CoreView *parent,
      std::unordered_map<std::string, std::unordered_map<std::string, std::string>> *props);

  std::shared_ptr<CoreView> getViewForType(std::string viewType);

  int readInt(Reader &reader, const char *key, float scale);

  inline static CoreViews *instance = nullptr;

  std::unordered_map<std::string, float> numConstantsCache;
};

inline CoreViews &CoreViews::getInstance() {
  return *instance;
}
