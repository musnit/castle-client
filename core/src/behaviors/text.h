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
            "Twemoji",
            "OpenSansEmoji",
            "3270Condensed-Condensed",
            "Abibas-Medium",
            "AstralMono-Regular",
            "Avara-Bold",
            "Avara-BoldItalic",
            "Betatron-Regular",
            "Blocus-Regular",
            "BreiteGrotesk-Regular",
            "Chicagoland-Medium",
            "ComicNeue-Bold",
            "ComicNeueAngular-Bold",
            "Compagnon-Bold",
            "Compagnon-Medium",
            "Compagnon-Roman",
            "DagsenOutline-Black",
            "Glacier-Bold",
            "HappyTimesAtTheIKOB-Regular",
            "HelicoCentrica-Roman",
            "Norm-Medium",
            "Norm-Regular",
            "Outward-Block",
            "Piazzolla-Medium",
            "SnapitMono-Regular",
            "SpaceGrotesk-Regular",
            "StandardGraf-Regular",
            "Syne-Extra",
            "YatraOne-Regular",
            "Zarathustra-Regular"
           )
         )
            = "Norm Regular";
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

  std::unique_ptr<love::Font> defaultFont;

  std::unordered_map<std::string, TextFontResource> fontResources;
  void loadFontResources();
  love::Font *getFont(TextFontResource *fontResource, float pixelSize) const;

  void updateFont(TextComponent &component);

  std::string formatContent(const std::string &content) const;
};
