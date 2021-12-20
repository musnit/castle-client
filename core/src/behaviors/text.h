#pragma once

#include "precomp.h"

#include "behaviors/base.h"
#include "props.h"


struct TextFontResource {
  love::StrongRef<love::Data> data;
  struct Entry {
    int pixelSize;
    std::unique_ptr<love::Font> font;
  };
  std::vector<Entry> entries;
};

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
    PROP(
         std::string, fontName,
         .label("Font")
         .rulesGet(false)
         .rulesSet(false)
         .allowedValues(
            "Overlay",
            "Twemoji",
            "OpenSansEmoji",
            "BreiteGrotesk",
            "Compagnon",
            "Glacier",
            "HelicoCentrica",
            "Piazzolla",
            "SpaceGrotesk-Medium",
            "SpaceGrotesk-Regular",
            "YatraOne",
            "Bore",
            "Synco",
            "Tektur"
           )
         )
            = "SpaceGrotesk-Regular";
    PROP(float, fontSize,
        .label("Font size")
        ) = 1;
    PROP(std::string, alignment,
        .label("Alignment")
        .allowedValues("left", "right", "center", "justify")
        ) = "left";
    PROP(love::Color, color,
        .label("Color")
        ) = { 0x24, 0x22, 0x34, 0xff };
  } props;

  struct TouchRectangle {
    love::Vector2 min { 0, 0 };
    love::Vector2 max { 0, 0 };
  };
  mutable std::optional<TouchRectangle> touchRectangle;
  TextFontResource *fontResource = nullptr;
};

class TextBehavior : public BaseBehavior<TextBehavior, TextComponent> {
public:
  static constexpr auto name = "Text";
  static constexpr auto behaviorId = 19;
  static constexpr auto displayName = "Text";
  static constexpr auto allowsDisableWithoutRemoval = false;

  explicit TextBehavior(Scene &scene_);

  void handleReadComponent(ActorId actorId, TextComponent &component, Reader &reader);
  void handlePrePerform();
  bool handleDrawComponent(ActorId actorId, const TextComponent &component,
      std::optional<SceneDrawingOptions> options) const;
  void handleDrawOverlay() const;

  void handleSetProperty(
      ActorId actorId, TextComponent &component, PropId propId, const ExpressionValue &value);

  bool hasTapTrigger(ActorId actorId);

  inline static const TouchToken overlayTouchToken;

private:
  friend struct ShowResponse;
  friend struct HideResponse;
  friend struct HideTextResponse;
  friend class Editor; // for sending text actors data to JS while editing

  Lv &lv { Lv::getInstance() };

  std::unordered_map<std::string, TextFontResource> fontResources;
  love::Font *overlayFont = nullptr;
  void loadFontResources();
  love::Font *getFont(TextFontResource *fontResource, float pixelSize) const;

  void updateFont(TextComponent &component);

  std::string formatContent(const std::string &content) const;
};
