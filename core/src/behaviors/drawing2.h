#pragma once

#include "precomp.h"

#include "behaviors/base.h"
#include "props.h"
#include "editor/draw/physics_body_data.h"
#include "utils/lru_cache.h"


struct Drawing2Component : BaseComponent {
  struct Props {
    PROP(
         float, initialFrame,
         .label("Initial frame")
         ) = 1;
    PROP(
         float, currentFrame,
         .label("Current frame")
         ) = 1;
    PROP(
         float, framesPerSecond,
         .min(-30)
         .max(30)
         .label("Frames per second")
         ) = 4;
    PROP(
         std::string, playMode,
         .label("Play mode")
         .allowedValues("still", "play once", "loop")
         ) = "still";
    PROP(
         float, loopStartFrame,
         .label("Loop start frame")
         ) = -1;
    PROP(
         float, loopEndFrame,
         .label("Loop end frame")
         ) = -1;
  } props;

  std::string hash;
  std::shared_ptr<love::DrawData> drawData;
  std::shared_ptr<PhysicsBodyData> physicsBodyData;
  love::AnimationState animationState;
};

struct DrawingAnimationProps {
  // Instances of this struct are never actually created -- it's just used for the prop ids

  DrawingAnimationProps() = delete;

  PROP(int, currentFrame);
  PROP(std::string, playMode) = "still";
  PROP(float, framesPerSecond);
  PROP(int, loopStartFrame);
  PROP(int, loopEndFrame);
};

// editor-only cache
struct DrawingEditorDataCache {
  struct Item {
    std::vector<std::string> base64PngFrames;
  };

  // component hash -> Item
  // this cache is only added to when the inspector is opened or a drawing is edited
  // it doesn't need to store all of the drawings in a scene
  LruCache<std::string, Item> items { 5 };
};

class Drawing2Behavior : public BaseBehavior<Drawing2Behavior, Drawing2Component> {

public:
  static constexpr auto name = "Drawing2";
  static constexpr auto behaviorId = 20;
  static constexpr auto displayName = "Drawing";
  static constexpr auto allowsDisableWithoutRemoval = false;

  using BaseBehavior::BaseBehavior;

  void handleReadComponent(ActorId actorId, Drawing2Component &component, Reader &reader);
  void handleWriteComponent(
      ActorId actorId, const Drawing2Component &component, Writer &writer) const;
  void handlePerform(double dt);
  bool handleDrawComponent(ActorId actorId, const Drawing2Component &component,
      std::optional<SceneDrawingOptions> options) const;

  ExpressionValue handleGetProperty(
      ActorId actorId, const Drawing2Component &component, PropId propId) const;
  void handleSetProperty(
      ActorId actorId, Drawing2Component &component, PropId propId, const ExpressionValue &value);

  std::string hash(const std::string &drawData, const std::string &physicsBodyData);
  PhysicsBodyData *maybeGetPhysicsBodyData(ActorId actorId);

  static void getAnimationComponentProperties(
      const Drawing2Component &component, love::AnimationComponentProperties &properties);

  // editor only: send drawing frames over bridge
  struct EditorSelectedDrawingFramesEvent {
    // copiedFrames stores the data and base64PngFrames is a pointer to copiedFrames
    // TODO: update the serialization library so that base64PngFrames doesn't need
    // to be a pointer
    std::vector<std::string> copiedFrames;
    PROP(std::vector<std::string> *, base64PngFrames);
  };
  void writeBase64PngFrames(
      const Drawing2Component &component, EditorSelectedDrawingFramesEvent *ev);
  void clearEditorDataCache();
  std::unique_ptr<DrawingEditorDataCache> editorDataCache;

  void cleanupRenderData();
  void cleanupDrawDataCache();

private:
  friend struct AnimationFrameMeetsConditionResponse;

  Lv &lv { Lv::getInstance() };

  std::unordered_map<std::string, std::shared_ptr<love::DrawData>> drawDataCache;


  void fireChangeFrameTriggers(ActorId actorId, const Drawing2Component &component);
};

inline PhysicsBodyData *Drawing2Behavior::maybeGetPhysicsBodyData(ActorId actorId) {
  if (auto component = maybeGetComponent(actorId)) {
    return component->physicsBodyData.get();
  }
  return nullptr;
}
