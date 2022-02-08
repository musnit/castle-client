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
         .rulesSet(false)
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
         .rulesGet(false)
         .rulesSet(false)
        ) = 10;
    PROP(float, fontSizeScale,
        .label("Font size scale")
         .rulesGet(false)
         .rulesSet(false)
        ) = 1;
    PROP(float, emsPerLine,
        .label("Number of 'm's that fit per line")
         .rulesGet(false)
         .rulesSet(false)
        ) = 1;
    PROP(std::string, alignment,
        .label("Alignment")
         .rulesGet(false)
         .rulesSet(false)
        .allowedValues("left", "right", "center", "justify")
        ) = "center";
    PROP(love::Color, color,
        .label("Color")
         .rulesGet(false)
         .rulesSet(false)
        ) = { 0x24, 0x22, 0x34, 0xff };
  } props;

  struct TouchRectangle {
    love::Vector2 min { 0, 0 };
    love::Vector2 max { 0, 0 };
  };
  mutable std::optional<TouchRectangle> touchRectangle;
  mutable TouchId lastTouchId = nullTouch;
  mutable bool touching = false;
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
  inline static const TouchToken leaderboardTouchToken;

  struct OverlayStyle {
    PROP(love::Colorf, regularBackgroundColor) = { 227 / 255.0, 230 / 255.0, 255 / 255.0, 1};
    PROP(love::Colorf, regularForegroundColor) = { 36 / 255.0, 34 / 255.0, 52 / 255.0, 1};
    PROP(love::Colorf, tappableBackgroundColor) = { 36 / 255.0, 34 / 255.0, 52 / 255.0, 1};
    PROP(love::Colorf, tappingBackgroundColor) = { 64 / 255.0, 51 / 255.0, 83 / 255.0, 1};
    PROP(love::Colorf, tappableForegroundColor) = { 227 / 255.0, 230 / 255.0, 255 / 255.0, 1};
    PROP(float, fontSize) = 20;
    PROP(float, horizontalPadding) = 4;
    PROP(float, topPadding) = 2.75;
    PROP(float, bottomPadding) = 2;
    PROP(float, horizontalMargin) = 4;
    PROP(float, betweenMargin) = 2;
    PROP(float, bottomMargin) = 4;
  };
  static OverlayStyle overlayStyle;

  static void loadFontResources(Lv &lv);
  static void unloadFontResources();
  static TextFontResource *getFontResource(const std::string &name);
  static love::Font *getFont(TextFontResource *fontResource, float pixelSize);

  void updateEmsPerLine(ActorId actorId, TextComponent &component);


private:
  friend struct ShowResponse;
  friend struct HideResponse;
  friend struct HideTextResponse;
  friend class Editor; // for sending text actors data to JS while editing

  Lv &lv { Lv::getInstance() };

  inline static std::unordered_map<std::string, TextFontResource> fontResources;
  mutable love::Font *overlayFont = nullptr;
  love::Font *getOverlayFont() const;

  std::unique_ptr<love::Canvas> previewCanvas;

  void updateFont(ActorId actorId, TextComponent &component);

  std::string formatContent(const std::string &content) const;
  void asciifyContent(std::string &content);
};

inline TextBehavior::OverlayStyle TextBehavior::overlayStyle;

inline TextFontResource *TextBehavior::getFontResource(const std::string &name) {
  return &fontResources[name];
}
