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

  loadFont("Comic Sans", comic_ttf);
  loadFont("Roboto", roboto_ttf);
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

bool TextBehavior::handleDrawComponent(ActorId actorId, const TextComponent &component,
    std::optional<SceneDrawingOptions> options) const {
  // TODO: Reject if outside camera bounds. Similar to Drawing2 -- move that into Body and reuse

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
