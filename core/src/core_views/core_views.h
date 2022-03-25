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

  CoreView() {
    mutex.lock();
    currentViewId++;
    viewId = currentViewId;
    isViewAlive[viewId] = true;
    mutex.unlock();
  }

  virtual ~CoreView() {
    mutex.lock();
    isViewAlive[viewId] = false;
    mutex.unlock();
  }

  virtual void read(Reader &reader, int viewportWidth, int viewportHeight) = 0;
  virtual void render() = 0;
  virtual void handleTouch(TouchEvent touch) {
  }
  virtual void update(double dt) {
  }
  virtual float getContentWidth() {
    return savedWidth;
  }

  void baseRead(Reader &reader, CoreView *parent,
      std::unordered_map<std::string, std::unordered_map<std::string, std::string>> *props,
      int viewportWidth = 800, int viewportHeight = 1120);
  void baseRender();
  void baseHandleTouch(TouchEvent touch);

  double left = 0;
  double top = 0;
  double absoluteTop = 0;
  double absoluteLeft = 0;
  double width = 0;
  double height = 0;
  double savedLeft = 0;
  double savedTop = 0;
  double savedWidth = 0;
  double savedHeight = 0;
  double hitSlopLeft = 0;
  double hitSlopTop = 0;
  double hitSlopRight = 0;
  double hitSlopBottom = 0;
  bool isVisible = true;
  bool isTouchEnabled = false;
  std::optional<std::string> onTapHandlerId;
  std::optional<std::string> id;
  std::vector<std::shared_ptr<CoreView>> children;
  Lv &lv { Lv::getInstance() };
  bool hasBackgroundColor = false;
  float backgroundColor[3];
  bool isTouchDown = false;
  float borderRadius = -1;
  inline static std::unique_ptr<love::Shader> borderRadiusImageShader = nullptr;
  inline static std::unique_ptr<love::Shader> borderRadiusColorShader = nullptr;
  int viewId;
  inline static std::map<int, bool> isViewAlive;
  inline static int currentViewId = 0;
  // feed errors can trigger coreviews changes on api response thread
  inline static std::mutex mutex;
};

class CoreViewAnimation {
public:
  std::string viewId;
  std::string key;
  float duration;
  float time;
  const std::function<std::string(float)> easingFunction;

  CoreViewAnimation(std::string viewId_, std::string key_, float duration_,
      const std::function<std::string(float)> easingFunction_)
      : viewId(viewId_)
      , key(key_)
      , duration(duration_)
      , easingFunction(easingFunction_) {
    time = 0.0;
  }
};

class CoreViewRenderer {
public:
  CoreViewRenderer(Bridge &bridge_, std::string layoutTemplateName_,
      std::shared_ptr<CoreView> layout_, int jsonVersion_, int width_, int height_)
      : bridge(bridge_)
      , layout(layout_)
      , jsonVersion(jsonVersion_)
      , layoutTemplateName(layoutTemplateName_)
      , width(width_)
      , height(height_) {
  }

  void update(double dt);
  void handleGesture(Gesture &gesture, int offsetX = 0, int offsetY = 0);
  std::optional<std::string> gestureViewId();
  void render();
  void cancelGestures();
  void registerTapHandler(const std::function<void(std::string)> handler);
  void reset();

  void updateProp(std::string viewId, std::string key, std::string value, bool force = false);
  std::string getProp(std::string viewId, std::string key);
  void updateJSGestureProp(std::string key, std::string value);
  void runAnimation(std::string viewId, std::string key, float duration,
      const std::function<std::string(float)> easingFunction);

  void lock();
  void unlock();

  CoreView &getView(std::string viewId);

private:
  void renderView(CoreView *view, float currentLeft, float currentTop);

  int width = 800;
  int height = 1120;
  Bridge &bridge;
  std::shared_ptr<CoreView> layout;
  int jsonVersion = 0;
  std::string layoutTemplateName;
  std::optional<CoreView *> touchView;
  int touchViewId = -1;
  bool isTouchOverView = false;
  Lv &lv { Lv::getInstance() };
  mutable love::Transform viewTransform;
  std::unordered_map<std::string, std::unordered_map<std::string, std::string>> props;
  std::unordered_map<std::string, std::string> jsGestureProps;
  std::optional<std::function<void(std::string)>> tapHandler;
  std::vector<CoreViewAnimation *> animations;
  std::mutex mutex;

  std::optional<std::pair<CoreView *, CoreView *>> getViewForId(
      CoreView *root, std::string id, CoreView *parent = nullptr);
  std::optional<CoreView *> getViewAtPoint(CoreView *root, float x, float y);
};

class CoreViews {
public:
  CoreViews(const CoreViews &) = delete; // Prevent accidental copies
  const CoreViews &operator=(const CoreViews &) = delete;

  CoreViews(Bridge &bridge);

  static CoreViews &getInstance();

  void setJson(std::string json);

  std::shared_ptr<CoreViewRenderer> getRenderer(
      std::string layoutTemplateName, int viewportWidth = 800, int viewportHeight = 1120);

  static void hexToRGBFloat(std::string hex, float *out);

  float getNumConstant(std::string key);

  int readInt(Reader &reader, const char *key, float scale, int viewportWidth, int viewportHeight);
  float readFloat(
      Reader &reader, const char *key, float scale, int viewportWidth, int viewportHeight);

private:
  friend class CoreViewRenderer;
  friend class CoreView;

  CoreViews &lv { *this };

  Bridge &bridge;

  std::string jsonString;

  int jsonVersion = 0;

  std::shared_ptr<CoreView> getView(std::string layoutTemplateName,
      std::unordered_map<std::string, std::unordered_map<std::string, std::string>> *props,
      int viewportWidth = 800, int viewportHeight = 1120);

  std::shared_ptr<CoreView> readViewFromJson(Reader &reader, CoreView *parent,
      std::unordered_map<std::string, std::unordered_map<std::string, std::string>> *props,
      int viewportWidth = 800, int viewportHeight = 1120);

  std::shared_ptr<CoreView> getViewForType(std::string viewType);

  inline static CoreViews *instance = nullptr;

  std::unordered_map<std::string, float> numConstantsCache;
};

inline CoreViews &CoreViews::getInstance() {
  return *instance;
}
