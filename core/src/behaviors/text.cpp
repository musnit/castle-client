#include "text.h"

#include "behaviors/all.h"
#include "archive.h"
#include "js.h"
#include "engine.h"


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
// Read, write
//

void TextBehavior::handleReadComponent(ActorId actorId, TextComponent &component, Reader &reader) {
  asciifyContent(component.props.content());

  if (component.props.order() == -1) {
    int maxExistingOrder = 0;

    forEachComponent([&](ActorId actorId, TextComponent &component) {
      if (component.props.order() >= maxExistingOrder) {
        maxExistingOrder = component.props.order();
      }
    });

    component.props.order() = maxExistingOrder + 1;
  }

  updateFont(actorId, component);

  // If we're invisible according to legacy prop, propagate to body prop
  if (!component.props.visible()) {
    auto &bodyBehavior = getBehaviors().byType<BodyBehavior>();
    if (auto bodyComponent = bodyBehavior.maybeGetComponent(actorId)) {
      bodyComponent->props.visible() = false;
    }
  }
}


//
// Perform
//

void TextBehavior::handlePrePerform() {
  auto &bodyBehavior = getBehaviors().byType<BodyBehavior>();

  // Clear touching state
  forEachComponent([&](ActorId actorId, TextComponent &component) {
    if (!bodyBehavior.hasComponent(actorId)) {
      component.touching = false;
    }
  });

  // Fire tap triggers
  auto &rulesBehavior = getBehaviors().byType<RulesBehavior>();
  getGesture().forEachTouch([&](TouchId touchId, const Touch &touch) {
    if (touch.isUsed() && !touch.isUsed(TextBehavior::overlayTouchToken)) {
      return;
    }

    forEachComponent([&](ActorId actorId, TextComponent &component) {
      if (bodyBehavior.hasComponent(actorId)) {
        return;
      }
      auto &rect = *component.touchRectangle;
      auto inRect = rect.min.x <= touch.pos.x && touch.pos.x <= rect.max.x
          && rect.min.y <= touch.pos.y && touch.pos.y <= rect.max.y;
      if (inRect) {
        if (touch.pressed) {
          component.lastTouchId = touchId;
        }
        component.touching = true;
      }
    });

    if (!(touch.pressed || touch.released)) {
      return;
    }
    rulesBehavior.fireAllIf<TextTapTrigger, TextComponent>(
        {}, [&](ActorId actorId, const TextTapTrigger &trigger, const TextComponent &component) {
          if (!component.props.visible()) {
            return false;
          }
          if (bodyBehavior.hasComponent(actorId)) {
            return false; // Skip if has Body since Body handles its own taps
          }
          if (!component.touchRectangle) {
            return false;
          }
          auto &rect = *component.touchRectangle;
          auto inRect = rect.min.x <= touch.pos.x && touch.pos.x <= rect.max.x
              && rect.min.y <= touch.pos.y && touch.pos.y <= rect.max.y;
          if (inRect) {
            touch.use(TextBehavior::overlayTouchToken);
            if (component.lastTouchId == touchId && touch.released) {
              return true;
            }
          }
          return false;
        });
  });
}


//
// Draw
//

love::Font *TextBehavior::getFont(TextFontResource *fontResource, float pixelSize) {
  for (auto &entry : fontResource->entries) {
    if (entry.pixelSize > 1024 || float(entry.pixelSize) > pixelSize) {
      return entry.font.get();
    }
  }
  constexpr auto baseSize = 64;
  for (float dpiScale = 1;; dpiScale *= 2) {
    auto candidatePixelSize
        = std::floorf(baseSize * dpiScale + 0.5f); // From 'freetype/TrueTypeRasterizer.cpp'
    if (candidatePixelSize > 1024 || candidatePixelSize > pixelSize) {
      Debug::log("dpiScale: {}", dpiScale);
      love::StrongRef rasterizer(Lv::getInstance().font.newTrueTypeRasterizer(fontResource->data,
                                     baseSize, dpiScale, love::TrueTypeRasterizer::HINTING_NORMAL),
          love::Acquire::NORETAIN);
      fontResource->entries.push_back({
          int(candidatePixelSize),
          std::unique_ptr<love::Font>(Lv::getInstance().graphics.newFont(rasterizer)),
      });
      return fontResource->entries.back().font.get();
    }
  }
}

love::Font *TextBehavior::getOverlayFont() const {
  if (!overlayFont) {
    overlayFont = getFont(&fontResources["Overlay"], 80);
  }
  return overlayFont;
}

bool TextBehavior::handleDrawComponent(ActorId actorId, const TextComponent &component,
    std::optional<SceneDrawingOptions> options) const {
  auto &scene = getScene();
  auto cameraScale = 800.0f / scene.getCameraSize().x;
  auto fontPixelScale = float(lv.window.getDPIScale()) * cameraScale;
  auto &bodyBehavior = getBehaviors().byType<BodyBehavior>();
  if (auto body = bodyBehavior.maybeGetPhysicsBody(actorId)) {
    if (auto info = getBehaviors().byType<BodyBehavior>().getRenderInfo(actorId);
        info.visible || (options && options->drawInvisibleActors)) {
      auto scaledFontSize = component.props.fontSizeScale() * component.props.fontSize();
      auto worldFontSize = std::clamp(scaledFontSize, 1.0f, 30.0f) / 10;
      auto font = component.fontResource
          ? getFont(component.fontResource, worldFontSize * fontPixelScale)
          : getOverlayFont();
      auto downscale = worldFontSize / font->getHeight();

      auto [x, y] = body->GetPosition();

      auto bounds = bodyBehavior.getEditorBounds(actorId);

      lv.graphics.push(love::Graphics::STACK_ALL);

      lv.graphics.setColor(love::toColorf(component.props.color()));

      // Move to and rotate around position
      lv.graphics.translate(x, y);
      lv.graphics.rotate(body->GetAngle());

      // Downscale since fonts are large
      lv.graphics.scale(downscale, downscale);
      bounds.minX() *= info.widthScale / downscale;
      bounds.maxX() *= info.widthScale / downscale;
      bounds.minY() *= info.heightScale / downscale;
      bounds.maxY() *= info.heightScale / downscale;

      // Alignment
      auto alignment = love::Font::ALIGN_LEFT;
      switch (component.props.alignment()[0]) {
      case 'r':
        alignment = love::Font::ALIGN_RIGHT;
        break;
      case 'c':
        alignment = love::Font::ALIGN_CENTER;
        break;
      case 'j':
        alignment = love::Font::ALIGN_JUSTIFY;
        break;
      }

      // Draw
      auto wrap = bounds.maxX() - bounds.minX();
      if (options->blueprintHighlight) {
        // Only padded rectangle in blueprint highlight mode
        std::vector<std::string> lines;
        font->getWrap(
            { { formatContent(component.props.content()), { 1, 1, 1, 1 } } }, wrap, lines);
        auto boundsHeight = bounds.maxY() - bounds.minY();
        auto height = std::max(boundsHeight, font->getHeight() * float(lines.size()));
        lv.graphics.setColor({ 0, 0, 0, 1 });
        float padding = 0.2f / downscale;
        lv.graphics.rectangle(love::Graphics::DRAW_FILL, bounds.minX() - padding,
            bounds.minY() - padding, wrap + 2 * padding, height + 2 * padding, 0.5f * padding,
            0.5f * padding, 10);
      } else {
        lv.graphics.setFont(font);
        lv.graphics.printf({ { formatContent(component.props.content()), { 1, 1, 1, 1 } } }, wrap,
            alignment, love::Matrix4(bounds.minX(), bounds.minY(), 0, 1, 1, 0, 0, 0, 0));
      }

      lv.graphics.pop();
    }
  }

  return true;
}

struct TextOverlayStyleReceiver {
  inline static const BridgeRegistration<TextOverlayStyleReceiver> registration {
    "TEXT_OVERLAY_STYLE"
  };

  struct Params {
    PROP(TextBehavior::OverlayStyle, style);
  } params;

  void receive(Engine &engine) {
    TextBehavior::overlayStyle = params.style();
  }
};

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
    if (!component.props.visible()) {
      return;
    }
    if (bodyBehavior.hasComponent(actorId)) {
      return; // Skip if has body
    }
    elems.push_back({ actorId, &component });
  });
  std::sort(elems.begin(), elems.end(), [&](const Elem &a, const Elem &b) {
    return a.component->props.order() > b.component->props.order();
  });
  if (elems.empty()) {
    return;
  }

  // Parameters
  auto &scene = getScene();
  auto &style = overlayStyle;
  auto fontScale = style.fontSize() / 10;
  auto horizontalPadding = style.horizontalPadding() / 10;
  auto topPadding = style.topPadding() / 10;
  auto bottomPadding = style.bottomPadding() / 10;
  auto horizontalMargin = style.horizontalMargin() / 10;
  auto betweenMargin = style.betweenMargin() / 10;
  auto bottomMargin = style.bottomMargin() / 10;

  // Draw bottom to top
  auto cameraPos = scene.getCameraPosition();
  auto cameraSize = scene.getCameraSize();
  auto x = cameraPos.x - 0.5f * cameraSize.x + horizontalMargin;
  auto boxWidth = cameraSize.x - 2 * horizontalMargin;
  auto textWidth = boxWidth - 2 * horizontalPadding;
  auto y = cameraPos.y + 0.5f * cameraSize.y - (bottomMargin - betweenMargin);
  auto font = getOverlayFont();
  auto fontHeight = font->getHeight();
  lv.graphics.push(love::Graphics::STACK_ALL);
  lv.graphics.setFont(font);
  auto &rulesBehavior = getBehaviors().byType<RulesBehavior>();
  auto &gesture = scene.getGesture();
  for (auto [actorId, component] : elems) {
    auto isTappable = rulesBehavior.hasTrigger<TextTapTrigger>(actorId);

    // Compute height
    float downscale = 0.1f * 0.0342f * fontScale;
    auto formatted = formatContent(component->props.content());
    std::vector<std::string> lines;
    font->getWrap({ { formatted, { 1, 1, 1, 1 } } }, textWidth / downscale, lines);
    auto textHeight = downscale * fontHeight * float(lines.size());
    auto boxHeight = topPadding + bottomPadding + textHeight;

    // Move up by box height, draw box
    y -= betweenMargin + boxHeight;
    if (isTappable) {
      if (component->touching && gesture.hasTouch(component->lastTouchId)) {
        lv.graphics.setColor(style.tappingBackgroundColor());
      } else {
        lv.graphics.setColor(style.tappableBackgroundColor());
      }
    } else {
      lv.graphics.setColor(style.regularBackgroundColor());
    }
    lv.graphics.rectangle(love::Graphics::DRAW_FILL, x, y, boxWidth, boxHeight, 0.1, 0.1, 6);

    // Draw text
    lv.graphics.push();
    lv.graphics.translate(x + horizontalPadding, y + topPadding);
    lv.graphics.scale(downscale, downscale);
    if (isTappable) {
      lv.graphics.setColor(style.tappableForegroundColor());
    } else {
      lv.graphics.setColor(style.regularForegroundColor());
    }
    lv.graphics.printf({ { std::move(formatted), { 1, 1, 1, 1 } } }, textWidth / downscale,
        love::Font::ALIGN_LEFT, love::Matrix4(0, 0, 0, 1, 1, 0, 0, 0, 0));
    lv.graphics.pop();

    // Save touch rectangle
    component->touchRectangle = {
      { x, y },
      { x + boxWidth, y + boxHeight },
    };
  }
  lv.graphics.pop();
}

std::optional<std::string> TextBehavior::handleDrawBase64PreviewPng(
    ActorId actorId, const TextComponent &component) {
  constexpr auto canvasSize = 256;
  auto padding = 22.0f;
  auto textLines = 3;
  auto textHeight = canvasSize - 2 * padding;
  auto fontSize = textHeight / float(textLines);
  if (!previewCanvas) {
    previewCanvas.reset(love::DrawDataFrame::newCanvas(canvasSize, canvasSize));
  }
  lv.renderTo(previewCanvas.get(), [&]() {
    lv.graphics.push(love::Graphics::STACK_ALL);
    lv.graphics.origin();
    lv.graphics.clear(love::Colorf(0, 0, 0, 0), 0, 0);

    auto font = component.fontResource ? getFont(component.fontResource, float(fontSize))
                                       : getOverlayFont();

    lv.graphics.setFont(font);

    // Background
    auto color = love::toColorf(component.props.color());
    lv.graphics.setColor({ 0.8, 0.8, 0.8, 1 });
    lv.graphics.rectangle(
        love::Graphics::DRAW_FILL, 0, 0, canvasSize, canvasSize, 1.2f * padding, 1.2f * padding);

    // Text
    auto fontHeight = font->getHeight();
    auto textScale = (textHeight / float(textLines)) / fontHeight;
    lv.graphics.setColor(color);
    lv.graphics.push();
    lv.graphics.scale(textScale, textScale);
    std::vector<std::string> lines;
    auto &content = component.props.content();
    font->getWrap({ { content, { 1, 1, 1, 1 } } }, textHeight / textScale, lines);
    auto numLines = std::min(3, int(lines.size()));
    for (auto i = 0; i < numLines; ++i) {
      lv.graphics.print({ { lines[i], { 1, 1, 1, 1 } } },
          love::Matrix4(padding / textScale, padding / textScale + fontHeight * float(i), 0, 1, 1,
              0, 0, 0, 0));
    }
    lv.graphics.pop();

    // Cover overflow
    lv.graphics.setColor({ 0.8, 0.8, 0.8, 1 });
    lv.graphics.setLineWidth(padding);
    lv.graphics.rectangle(love::Graphics::DRAW_FILL, canvasSize - padding, 1.22f * padding, padding,
        canvasSize - 2 * 1.22f * padding);

    lv.graphics.pop();
  });
  return love::DrawDataFrame::encodeBase64Png(previewCanvas.get());
}


//
// Getters, setters
//

void TextBehavior::handleSetProperty(
    ActorId actorId, TextComponent &component, PropId propId, const ExpressionValue &value) {
  auto &props = component.props;
  if (propId == props.content.id) {
    if (const char *cStrValue = value.as<const char *>();
        cStrValue && component.props.content() != cStrValue) {
      component.props.content() = cStrValue;
      asciifyContent(component.props.content());
    }
  } else if (propId == props.fontName.id) {
    if (const char *cStrValue = value.as<const char *>();
        cStrValue && component.props.fontName() != cStrValue) {
      component.props.fontName() = cStrValue;
      updateFont(actorId, component);
    }
  } else {
    BaseBehavior::handleSetProperty(actorId, component, propId, value);
  }
}

void TextBehavior::updateFont(ActorId actorId, TextComponent &component) {
  if (auto found = fontResources.find(component.props.fontName()); found != fontResources.end()) {
    component.fontResource = &found->second;
  }
  updateEmsPerLine(actorId, component);
}

void TextBehavior::updateEmsPerLine(ActorId actorId, TextComponent &component) {
  auto &bodyBehavior = getBehaviors().byType<BodyBehavior>();
  if (!bodyBehavior.hasComponent(actorId)) {
    return;
  }

  auto cameraScale = 1.0f;
  auto fontPixelScale = float(lv.window.getDPIScale()) * cameraScale;
  auto info = getBehaviors().byType<BodyBehavior>().getRenderInfo(actorId);
  auto scaledFontSize = component.props.fontSizeScale() * component.props.fontSize();
  auto worldFontSize = std::clamp(scaledFontSize, 1.0f, 30.0f) / 10;
  auto font = component.fontResource
      ? getFont(component.fontResource, worldFontSize * fontPixelScale)
      : getOverlayFont();
  auto downscale = worldFontSize / font->getHeight();

  auto bounds = bodyBehavior.getEditorBounds(actorId);

  // Downscale since fonts are large
  bounds.minX() *= info.widthScale / downscale;
  bounds.maxX() *= info.widthScale / downscale;
  bounds.minY() *= info.heightScale / downscale;
  bounds.maxY() *= info.heightScale / downscale;
  auto wrap = bounds.maxX() - bounds.minX();

  std::vector<std::string> lines;
  std::vector<int> lineWidths;
  font->getWrap({ { "m", { 1, 1, 1, 1 } } }, wrap, lines, &lineWidths);

  if (!lineWidths.empty()) {
    component.props.emsPerLine() = wrap / float(lineWidths[0]);
  }
}


//
// Content formatting
//

std::string TextBehavior::formatContent(const std::string &content) const {
  std::string result;
  static std::regex re("\\$([a-zA-Z0-9_-]+)");
  auto it = content.begin(), end = content.end();
  auto editVariables = getScene().getEditVariables();
  auto &variables = getScene().getVariables();
  for (std::smatch match; std::regex_search(it, end, match, re); it = match[0].second) {
    result += match.prefix();
    auto name = match.str(1);
    std::optional<ExpressionValue> value;
    if (editVariables) {
      if (auto editVariable = editVariables->getByName(name)) {
        value = editVariable->initialValue;
      }
    } else {
      value = variables.get(name);
    }
    if (value) {
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

void TextBehavior::asciifyContent(std::string &content) {
  const auto isNotAscii = [&](char c) {
    return !(0 <= c && c <= 127);
  };
  content.erase(std::remove_if(content.begin(), content.end(), isNotAscii), content.end());
}
