#pragma once

#include "precomp.h"

#include "behaviors/base.h"
#include "props.h"
#include "editor/draw/physics_body_data.h"


struct Drawing2Component : BaseComponent {
  struct Props {
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
  PROP(std::string, playMode);
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
  // TODO: use LRU eviction
  std::unordered_map<std::string, Item> items;
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
  void handleDrawComponent(ActorId actorId, const Drawing2Component &component) const;

  ExpressionValue handleGetProperty(
      ActorId actorId, const Drawing2Component &component, PropId propId) const;
  void handleSetProperty(
      ActorId actorId, Drawing2Component &component, PropId propId, const ExpressionValue &value);

  std::string hash(const std::string &drawData, const std::string &physicsBodyData);
  PhysicsBodyData *maybeGetPhysicsBodyData(ActorId actorId);

  // editor only: send drawing frames over bridge
  struct EditorSelectedDrawingFramesEvent {
    PROP(std::vector<std::string> *, base64PngFrames);
  };
  void writeBase64PngFrames(
      const Drawing2Component &component, EditorSelectedDrawingFramesEvent *ev);
  void clearEditorDataCache();
  std::unique_ptr<DrawingEditorDataCache> editorDataCache;

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
