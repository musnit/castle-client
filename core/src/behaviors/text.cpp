#include "text.h"

#include "behaviors/all.h"
#include "archive.h"
#include "js.h"
#include "engine.h"

#include "data/fonts.h"


//
// Embedded font data
//

struct EmbeddedFontData : love::Data {
  unsigned char *data;
  int size;

  template<int N>
  explicit EmbeddedFontData(unsigned char (&xxdData)[N])
      : data(xxdData)
      , size(sizeof(xxdData)) {
  }

  EmbeddedFontData(unsigned char *data_, int size_)
      : data(data_)
      , size(size_) {
  }

  Data *clone() const override {
    return new EmbeddedFontData(data, size);
  }

  void *getData() const override {
    return data;
  }

  size_t getSize() const override {
    return size;
  }
};


//
// Triggers
//

struct TextTapTrigger : BaseTrigger {
  inline static const RuleRegistration<TextTapTrigger, TextBehavior> registration { "tap" };
  static constexpr auto description = "When this is tapped";

  struct Params {
  } params;
};

bool TextBehavior::hasTapTrigger(ActorId actorId) {
  auto &rulesBehavior = getBehaviors().byType<RulesBehavior>();
  if (getScene().getIsEditing()) {
    // can't query `rulesBehavior.hasTrigger` because we don't build trigger components at edit-time
    if (auto component = rulesBehavior.maybeGetComponent(actorId); component) {
      Reader reader(component->editData->value);
      auto found = false;
      reader.each("rules", [&]() {
        reader.obj("trigger", [&]() {
          if (reader.num("behaviorId", -1) == TextBehavior::behaviorId
              && std::strcmp(reader.str("name", ""), "tap") == 0) {
            found = true;
          }
        });
      });
      return found;
    }
  } else {
    return rulesBehavior.hasTrigger<TextTapTrigger>(actorId);
  }
  return false;
}


//
// Responses
//

struct Card {
  Card() = default;

  void read(Reader &reader) {
    title = reader.str("title", "");
    cardId = reader.str("cardId", "");
    // JS_preloadCardId(cardId.c_str(), cardId.size());
  }

  std::string title;
  std::string cardId;
};

struct SendPlayerToCardResponse : BaseResponse {
  inline static const RuleRegistration<SendPlayerToCardResponse, TextBehavior> registration {
    "send player to card"
  };
  static constexpr auto description = "Send player to a different card";

  struct Params {
    PROP(Card, card, .label("destination card"));
  } params;

  void run(RuleContext &ctx) override {
    ctx.getScene().setNextCardId(params.card().cardId);
  }
};

struct ShowResponse : BaseResponse {
  inline static const RuleRegistration<ShowResponse, TextBehavior> registration { "show" };
  static constexpr auto description = "Show this text (legacy)";

  struct Params {
  } params;

  void run(RuleContext &ctx) override {
    auto &textBehavior = ctx.getScene().getBehaviors().byType<TextBehavior>();
    if (auto component = textBehavior.maybeGetComponent(ctx.actorId)) {
      component->props.visible() = true;
    }
  }
};

struct HideResponse : BaseResponse {
  inline static const RuleRegistration<HideResponse, TextBehavior> registration { "hide" };
  static constexpr auto description = "Hide this text (legacy)";

  struct Params {
  } params;

  void run(RuleContext &ctx) override {
    auto &textBehavior = ctx.getScene().getBehaviors().byType<TextBehavior>();
    if (auto component = textBehavior.maybeGetComponent(ctx.actorId)) {
      component->props.visible() = false;
    }
  }
};


//
// Constructor, destructor
//

TextBehavior::TextBehavior(Scene &scene_)
    : BaseBehavior(scene_) {
  constexpr auto defaultFontSize = 10;

  defaultFont.reset(
      lv.graphics.newDefaultFont(defaultFontSize, love::TrueTypeRasterizer::HINTING_NORMAL));

  const auto loadFont = [&](const std::string &name, auto &xxdData) {
    love::StrongRef data(new EmbeddedFontData(xxdData), love::Acquire::NORETAIN);
    love::StrongRef rasterizer(lv.font.newTrueTypeRasterizer(
                                   data, defaultFontSize, love::TrueTypeRasterizer::HINTING_NORMAL),
        love::Acquire::NORETAIN);
    fonts[name] = std::unique_ptr<love::Font>(lv.graphics.newFont(rasterizer));
  };

  loadFont("3270Condensed Condensed", __3270Condensed_Condensed_ttf);
  loadFont("Abibas Medium", Abibas_Medium_ttf);
  loadFont("AstralMono Regular", AstralMono_Regular_ttf);
  loadFont("Avara Bold", Avara_Bold_ttf);
  loadFont("Avara BoldItalic", Avara_BoldItalic_ttf);
  loadFont("Betatron Regular", Betatron_Regular_ttf);
  loadFont("Blocus Regular", Blocus_Regular_ttf);
  loadFont("BreiteGrotesk Regular", BreiteGrotesk_Regular_ttf);
  loadFont("Chicagoland Medium", Chicagoland_Medium_ttf);
  loadFont("ComicNeue Bold", ComicNeue_Bold_ttf);
  loadFont("ComicNeueAngular Bold", ComicNeueAngular_Bold_ttf);
  loadFont("Compagnon Bold", Compagnon_Bold_ttf);
  loadFont("Compagnon Medium", Compagnon_Medium_ttf);
  loadFont("Compagnon Roman", Compagnon_Roman_ttf);
  loadFont("DagsenOutline Black", DagsenOutline_Black_ttf);
  loadFont("Glacier Bold", Glacier_Bold_ttf);
  loadFont("HappyTimesAtTheIKOB Regular", HappyTimesAtTheIKOB_Regular_ttf);
  loadFont("HelicoCentrica Roman", HelicoCentrica_Roman_ttf);
  loadFont("Norm Medium", Norm_Medium_ttf);
  loadFont("Norm Regular", Norm_Regular_ttf);
  loadFont("Outward Block", Outward_Block_ttf);
  loadFont("Piazzolla Medium", Piazzolla_Medium_ttf);
  loadFont("SnapitMono Regular", SnapitMono_Regular_ttf);
  loadFont("SpaceGrotesk Regular", SpaceGrotesk_Regular_ttf);
  loadFont("StandardGraf Regular", StandardGraf_Regular_ttf);
  loadFont("Syne Extra", Syne_Extra_ttf);
  loadFont("YatraOne Regular", YatraOne_Regular_ttf);
  loadFont("Zarathustra Regular", Zarathustra_Regular_ttf);
}


//
// Read, write
//

void TextBehavior::handleReadComponent(ActorId actorId, TextComponent &component, Reader &reader) {
  if (component.props.order() == -1) {
    int maxExistingOrder = 0;

    forEachComponent([&](ActorId actorId, TextComponent &component) {
      if (component.props.order() >= maxExistingOrder) {
        maxExistingOrder = component.props.order();
      }
    });

    component.props.order() = maxExistingOrder + 1;
  }

  updateFont(component);
}


//
// Perform
//

void TextBehavior::handlePerform(double dt) {
}


//
// Draw
//

bool TextBehavior::handleDrawComponent(ActorId actorId, const TextComponent &component,
    std::optional<SceneDrawingOptions> options) const {
  auto &bodyBehavior = getBehaviors().byType<BodyBehavior>();
  if (auto body = bodyBehavior.maybeGetPhysicsBody(actorId)) {
    if (auto info = getBehaviors().byType<BodyBehavior>().getRenderInfo(actorId);
        info.visible || (options && options->drawInvisibleActors)) {
      auto [x, y] = body->GetPosition();

      auto bounds = bodyBehavior.getEditorBounds(actorId);

      lv.graphics.push(love::Graphics::STACK_ALL);

      lv.graphics.setColor(love::Colorf(1, 1, 1, 1));

      // Move to and rotate around position
      lv.graphics.translate(x, y);
      lv.graphics.rotate(body->GetAngle());

      // Downscale since fonts are large
      constexpr float downscale = 0.08;
      lv.graphics.scale(downscale, downscale);
      bounds.minX() *= info.widthScale / downscale;
      bounds.maxX() *= info.widthScale / downscale;
      bounds.minY() *= info.heightScale / downscale;
      bounds.maxY() *= info.heightScale / downscale;

      // Draw
      auto wrap = bounds.maxX() - bounds.minX();
      if (component.font) {
        lv.graphics.setFont(component.font);
      } else {
        lv.graphics.setFont(defaultFont.get());
      }
      lv.graphics.printf({ { component.props.content(), { 0, 0, 0, 1 } } }, wrap,
          love::Font::ALIGN_LEFT, love::Matrix4(bounds.minX(), bounds.minY(), 0, 1, 1, 0, 0, 0, 0));

      lv.graphics.pop();
    }
  }

  return true;
}

void TextBehavior::handleDrawOverlay() const {
  // Draw texts without bodies as overlays along bottom of screen

  // Collect in reverse order, because we draw bottom to top
  auto &bodyBehavior = getBehaviors().byType<BodyBehavior>();
  struct Elem {
    ActorId actorId;
    const TextComponent *component;
  };
  SmallVector<Elem, 16> elems;
  forEachEnabledComponent([&](ActorId actorId, const TextComponent &component) {
    if (bodyBehavior.hasComponent(actorId)) {
      return;
    }
    elems.push_back({ actorId, &component });
  });
  std::sort(elems.begin(), elems.end(), [&](const Elem &a, const Elem &b) {
    return a.component->props.order() > b.component->props.order();
  });
  if (elems.empty()) {
    return;
  }

  // Draw bottom to top
  constexpr float margin = 0.2; // Gap around box, between boxes
  constexpr float padding = 0.2; // Gap between text and box edge
  auto &scene = getScene();
  auto cameraPos = scene.getCameraPosition();
  auto cameraSize = scene.getCameraSize();
  auto x = cameraPos.x - 0.5f * cameraSize.x + margin;
  auto boxWidth = cameraSize.x - 2 * margin;
  auto textWidth = boxWidth - 2 * padding;
  auto y = cameraPos.y + 0.5f * cameraSize.y;
  auto font = defaultFont.get();
  auto fontHeight = font->getHeight();
  lv.graphics.push(love::Graphics::STACK_ALL);
  lv.graphics.setFont(font);
  for (auto [actorId, component] : elems) {
    // Compute height
    constexpr float downscale = 0.024;
    auto &content = component->props.content();
    std::vector<std::string> lines;
    font->getWrap({ { content, { 1, 1, 1, 1 } } }, textWidth / downscale, lines);
    auto textHeight = downscale * fontHeight * float(lines.size());
    auto boxHeight = 2 * padding + textHeight;

    // Move up by box height, draw box
    y -= margin + boxHeight;
    lv.graphics.setColor({ 0, 0, 0, 1 });
    lv.graphics.rectangle(love::Graphics::DRAW_FILL, x, y, boxWidth, boxHeight, 0.1, 0.1, 6);

    // Draw text
    lv.graphics.push();
    lv.graphics.translate(x + padding, y + padding);
    lv.graphics.scale(downscale, downscale);
    lv.graphics.setColor({ 1, 1, 1, 1 });
    lv.graphics.printf({ { content, { 1, 1, 1, 1 } } }, textWidth / downscale,
        love::Font::ALIGN_LEFT, love::Matrix4(0, 0, 0, 1, 1, 0, 0, 0, 0));
    lv.graphics.pop();
  }
  lv.graphics.pop();
}


//
// Getters, setters
//

void TextBehavior::handleSetProperty(
    ActorId actorId, TextComponent &component, PropId propId, const ExpressionValue &value) {
  auto &props = component.props;
  if (propId == props.fontName.id) {
    const char *cStrValue = value.as<const char *>();
    if (strcmp(cStrValue, component.props.fontName().c_str()) != 0) {
      component.props.fontName() = cStrValue;
      updateFont(component);
    }
  } else {
    BaseBehavior::handleSetProperty(actorId, component, propId, value);
  }
}

void TextBehavior::updateFont(TextComponent &component) {
  if (auto found = fonts.find(component.props.fontName()); found != fonts.end()) {
    component.font = found->second.get();
  } else {
    component.font = defaultFont.get();
  }
}


//
// Content formatting
//

std::string TextBehavior::formatContent(const std::string &content) const {
  std::string result;
  static std::regex re("\\$([a-zA-Z0-9_-]+)");
  auto it = content.begin(), end = content.end();
  auto &variables = getScene().getVariables();
  for (std::smatch match; std::regex_search(it, end, match, re); it = match[0].second) {
    result += match.prefix();
    auto name = match.str(1);
    if (auto value = variables.get(name)) {
      // We want to remove trailing zeros and show at most 5 digits after the decimal point.
      // `.5f` keeps trailing zeros, while `.5g` counts digits before the decimal point. So we need
      // to work around this...
      auto str = fmt::format("{:.5f}", value->as<double>());
      if (!str.empty()) {
        auto strip = int(str.size() - 1);
        while (strip > 0 && str[strip] == '0') {
          --strip;
        }
        if (strip > 0 && str[strip] == '.') {
          --strip;
        }
        result += str.substr(0, strip + 1);
      }
    } else {
      result += '$';
      result += name;
    }
  }
  result.append(it, end);
  return result;
}
