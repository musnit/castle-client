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
            "BreiteGrotesk",
            "Compagnon",
            "Glacier",
            "HelicoCentrica",
            "Piazzolla",
            "YatraOne",
            "Bore",
            "Synco",
            "Tektur"
           )
         )
            = "BreiteGrotesk";
    PROP(float, fontSize,
        .label("Font size")
        ) = 10;
    PROP(float, fontSizeScale,
        .label("Font size scale")
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

  using BaseBehavior::BaseBehavior;


  void handleReadComponent(ActorId actorId, TextComponent &component, Reader &reader);
  void handlePrePerform();
  bool handleDrawComponent(ActorId actorId, const TextComponent &component,
      std::optional<SceneDrawingOptions> options) const;
  void handleDrawOverlay() const;
  std::optional<std::string> handleDrawBase64PreviewPng(
      ActorId actorId, const TextComponent &component);

  void handleSetProperty(
      ActorId actorId, TextComponent &component, PropId propId, const ExpressionValue &value);

  bool hasTapTrigger(ActorId actorId);

  inline static const TouchToken overlayTouchToken;

  struct OverlayStyle {
    PROP(love::Colorf, regularBackgroundColor) = { 1, 1, 1, 1 };
    PROP(love::Colorf, regularForegroundColor) = { 0, 0, 0, 1 };
    PROP(love::Colorf, tappableBackgroundColor) = { 0, 0, 0, 1 };
    PROP(love::Colorf, tappableForegroundColor) = { 1, 1, 1, 1 };
    PROP(float, fontSize) = 10;
    PROP(float, horizontalPadding) = 2;
    PROP(float, topPadding) = 2;
    PROP(float, bottomPadding) = 2;
    PROP(float, horizontalMargin) = 2;
    PROP(float, betweenMargin) = 2;
    PROP(float, bottomMargin) = 2;
  };
  static OverlayStyle overlayStyle;

  static void loadFontResources(Lv &lv);

private:
  friend struct ShowResponse;
  friend struct HideResponse;
  friend struct HideTextResponse;
  friend class Editor; // for sending text actors data to JS while editing

  Lv &lv { Lv::getInstance() };

  inline static std::unordered_map<std::string, TextFontResource> fontResources;
  mutable love::Font *overlayFont = nullptr;
  love::Font *getFont(TextFontResource *fontResource, float pixelSize) const;
  love::Font *getOverlayFont() const;

  std::unique_ptr<love::Canvas> previewCanvas;

  void updateFont(TextComponent &component);

  std::string formatContent(const std::string &content) const;
};

inline TextBehavior::OverlayStyle TextBehavior::overlayStyle;
