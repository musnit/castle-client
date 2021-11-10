#pragma once

#include "precomp.h"

#include "behaviors/base.h"
#include "props.h"


struct TextComponent : BaseComponent {
  struct Props {
    PROP(
         std::string, content,
         .label("Content")
         .rulesGet(false)
         ) = "";
    PROP(
         bool, visible,
         .label("Visible")
         .rulesGet(false)
         ) = true;
    PROP(int, order) = -1;
  } props;
};

class TextBehavior : public BaseBehavior<TextBehavior, TextComponent> {
public:
  static constexpr auto name = "Text";
  static constexpr auto behaviorId = 19;
  static constexpr auto displayName = "Text";
  static constexpr auto allowsDisableWithoutRemoval = false;

  using BaseBehavior::BaseBehavior;

  void handleReadComponent(ActorId actorId, TextComponent &component, Reader &reader);
  void handlePerform(double dt);
  bool handleDrawComponent(ActorId actorId, const TextComponent &component,
      std::optional<SceneDrawingOptions> options) const;

  std::queue<int> clickedTextActorIdsQueue;

  bool hasTapTrigger(ActorId actorId);

private:
  friend struct ShowResponse;
  friend struct HideResponse;
  friend struct HideTextResponse;
  friend class Editor; // for sending text actors data to JS while editing

  Lv &lv { Lv::getInstance() };

  std::unique_ptr<love::Font> textPreviewFont = std::unique_ptr<love::Font>(
      lv.graphics.newDefaultFont(2, love::TrueTypeRasterizer::HINTING_NORMAL));

  std::string formatContent(const std::string &content) const;
};
