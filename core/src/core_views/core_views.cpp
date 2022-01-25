#include "core_views.h"
#include "editor/draw/util.h"
#include "api.h"
#include "behaviors/text.h"

//
// CoreViewRenderer
//

void CoreViewRenderer::render() {
  if (jsonVersion != CoreViews::getInstance().jsonVersion) {
    jsonVersion = CoreViews::getInstance().jsonVersion;

    layout = CoreViews::getInstance().getView(layoutTemplateName);
  }

  renderView(layout);
}

void CoreViewRenderer::renderView(std::shared_ptr<CoreView> view) {
  lv.graphics.push(love::Graphics::STACK_ALL);
  viewTransform.reset();
  viewTransform.translate(view->x, view->y);
  lv.graphics.applyTransform(&viewTransform);

  view->baseRender();

  for (size_t i = 0; i < view->children.size(); i++) {
    renderView(view->children[i]);
  }

  lv.graphics.pop();
}

void CoreViewRenderer::update(double dt) {
}

struct CoreViewsGestureEvent {
  PROP(std::string, gestureHandlerId);
};

void CoreViewRenderer::handleGesture(Gesture &gesture) {
  gesture.withSingleTouch([&](const Touch &touch) {
    if (touch.pressed) {
      touchView = getViewAtPoint(layout, touch.screenPos.x, touch.screenPos.y);
      if (touchView) {
        isTouchOverView = true;
        (*touchView)->baseHandleTouch(CoreView::TouchEvent::Down);
      }
    }

    if (!touchView) {
      return;
    }

    auto newTouchView = getViewAtPoint(layout, touch.screenPos.x, touch.screenPos.y);
    bool newIsTouchOverView = newTouchView == touchView;

    if (isTouchOverView && !newIsTouchOverView) {
      (*touchView)->baseHandleTouch(CoreView::TouchEvent::Up);
    } else if (!isTouchOverView && newIsTouchOverView) {
      (*touchView)->baseHandleTouch(CoreView::TouchEvent::Down);
    }

    isTouchOverView = newIsTouchOverView;

    if (touch.released) {
      (*touchView)->baseHandleTouch(CoreView::TouchEvent::Up);

      if (isTouchOverView) {
        (*touchView)->baseHandleTouch(CoreView::TouchEvent::Tap);

        if ((*touchView)->onTapHandlerId) {
          CoreViewsGestureEvent ev;
          ev.gestureHandlerId = *((*touchView)->onTapHandlerId);
          bridge.sendEvent("CORE_VIEWS_GESTURE", ev);
        }
      }

      touchView = std::nullopt;
      isTouchOverView = false;
    }
  });
}

std::optional<std::shared_ptr<CoreView>> CoreViewRenderer::getViewAtPoint(
    std::shared_ptr<CoreView> root, float x, float y) {
  if (x >= root->x && x <= root->x + root->width && y >= root->y && y <= root->y + root->height) {
    for (int i = root->children.size() - 1; i >= 0; i--) {
      auto childResult = getViewAtPoint(root->children[i], x - root->x, y - root->y);
      if (childResult) {
        return childResult;
      }
    }

    return root;
  } else {
    return std::nullopt;
  }
}

//
// CoreViews
//

CoreViews::CoreViews(Bridge &bridge_)
    : bridge(bridge_) {
  instance = this;
}

void CoreViews::setJson(std::string json) {
  jsonString = json;
  jsonVersion++;
}

std::shared_ptr<CoreViewRenderer> CoreViews::getRenderer(std::string layoutTemplateName) {
  return std::make_shared<CoreViewRenderer>(
      bridge, layoutTemplateName, getView(layoutTemplateName));
}

std::shared_ptr<CoreView> CoreViews::getView(std::string layoutTemplateName) {
  auto archive = Archive::fromJson(jsonString.c_str());
  std::shared_ptr<CoreView> result = nullptr;

  archive.read([&](Reader &reader) {
    reader.obj(layoutTemplateName.c_str(), [&]() {
      result = readViewFromJson(reader);
    });
  });

  return result;
}

std::shared_ptr<CoreView> CoreViews::readViewFromJson(Reader &reader) {
  auto type = reader.str("type", "");
  auto view = getViewForType(type);
  view->baseRead(reader);
  return view;
}

//
// Views
//

void CoreView::baseRead(Reader &reader) {
  x = reader.num("x", 0);
  y = reader.num("y", 0);
  width = reader.num("width", 0);
  height = reader.num("height", 0);
  id = reader.str("id");
  onTapHandlerId = reader.str("onTapHandlerId");

  auto backgroundColorStr = reader.str("backgroundColor");
  if (backgroundColorStr) {
    hasBackgroundColor = true;
    int num = std::stoi(std::string(*backgroundColorStr).substr(1), nullptr, 16);
    DrawUtil::hexToRGBFloat(num, backgroundColor);
  }

  if (reader.has("children")) {
    reader.arr("children", [&]() {
      reader.each([&]() {
        children.push_back(CoreViews::getInstance().readViewFromJson(reader));
      });
    });
  }

  read(reader);
}

void CoreView::baseRender() {
  if (hasBackgroundColor) {
    static auto quad = [&]() {
      std::vector<love::graphics::Vertex> quadVerts {
        { 0, 0, 0, 0, { 0xff, 0xff, 0xff, 0xff } },
        { 1, 0, 1, 0, { 0xff, 0xff, 0xff, 0xff } },
        { 1, 1, 1, 1, { 0xff, 0xff, 0xff, 0xff } },
        { 0, 1, 0, 1, { 0xff, 0xff, 0xff, 0xff } },
      };
      return lv.graphics.newMesh(
          quadVerts, love::graphics::PRIMITIVE_TRIANGLE_FAN, love::graphics::vertex::USAGE_STATIC);
    }();

    lv.graphics.setColor(
        { backgroundColor[0], backgroundColor[1], backgroundColor[2], isTouchDown ? 0.6f : 1.0f });
    quad->draw(&lv.graphics, love::Matrix4(0, 0, 0, width, height, 0, 0, 0, 0));
  }

  render();
}

void CoreView::baseHandleTouch(TouchEvent touch) {
  if (touch == Down) {
    isTouchDown = true;
  } else if (touch == Up) {
    isTouchDown = false;
  }

  handleTouch(touch);
}

class View : public CoreView {
  void read(Reader &reader) {
  }

  void render() {
  }
};

class ImageView : public CoreView {
  enum ResizeMode {
    Contain,
    Stretch,
  };

  love::data::ByteData *byteData = nullptr;
  love::image::ImageData *imageData = nullptr;
  love::graphics::Image *image = nullptr;
  ResizeMode resizeMode;

  void read(Reader &reader) {
    auto url = reader.str("url");

    if (url) {
      API::getData(*url, [=](APIDataResponse &response) {
        love::data::DataModule *dataModule
            = love::Module::getInstance<love::data::DataModule>(love::Module::M_DATA);

        byteData = dataModule->newByteData(response.data, response.length);
      });
    }

    std::string resizeModeStr = reader.str("resizeMode", "stretch");
    if (resizeModeStr == "contain") {
      resizeMode = ResizeMode::Contain;
    } else {
      resizeMode = ResizeMode::Stretch;
    }
  }

  void render() {
    if (byteData && !imageData) {
      imageData = lv.image.newImageData(byteData);

      love::graphics::Image::Settings settings;

      love::graphics::Image::Slices slices(love::graphics::TEXTURE_2D);
      slices.set(0, 0, imageData);

      image = lv.graphics.newImage(slices, settings);
      love::graphics::Texture::Filter f = image->getFilter();
      f.min = love::graphics::Texture::FILTER_NEAREST;
      f.mag = love::graphics::Texture::FILTER_NEAREST;
      image->setFilter(f);
    }

    if (!image) {
      return;
    }

    static auto quad = [&]() {
      std::vector<love::graphics::Vertex> quadVerts {
        { 0, 0, 0, 0, { 0xff, 0xff, 0xff, 0xff } },
        { 1, 0, 1, 0, { 0xff, 0xff, 0xff, 0xff } },
        { 1, 1, 1, 1, { 0xff, 0xff, 0xff, 0xff } },
        { 0, 1, 0, 1, { 0xff, 0xff, 0xff, 0xff } },
      };
      return lv.graphics.newMesh(
          quadVerts, love::graphics::PRIMITIVE_TRIANGLE_FAN, love::graphics::vertex::USAGE_STATIC);
    }();

    lv.graphics.setColor({ 1.0, 1.0, 1.0, isTouchDown ? 0.6f : 1.0f });
    quad->setTexture(image);

    if (resizeMode == ResizeMode::Stretch) {
      quad->draw(&lv.graphics, love::Matrix4(0, 0, 0, width, height, 0, 0, 0, 0));
    } else {
      int imageWidth = imageData->getWidth();
      int imageHeight = imageData->getHeight();

      if ((float)imageWidth / imageHeight > (float)width / height) {
        int renderHeight = width * ((float)imageHeight / imageWidth);
        quad->draw(&lv.graphics,
            love::Matrix4(
                0, (int)((height - renderHeight) * 0.5), 0, width, renderHeight, 0, 0, 0, 0));
      } else {
        int renderWidth = height * ((float)imageWidth / imageHeight);
        quad->draw(&lv.graphics,
            love::Matrix4(
                (int)((width - renderWidth) * 0.5), 0, 0, renderWidth, height, 0, 0, 0, 0));
      }
    }

    quad->setTexture(nullptr);
  }
};

class TextView : public CoreView {
  std::string text;
  mutable love::Font *font = nullptr;
  love::Font::AlignMode textAlign = love::Font::ALIGN_LEFT;
  float color[3];
  float fontSize;
  std::string fontFamily;

  void read(Reader &reader) {
    text = reader.str("text", "");

    fontSize = reader.num("fontSize", 10);

    fontFamily = reader.str("fontFamily", "Overlay");

    std::string textAlignStr = reader.str("textAlign", "left");
    if (textAlignStr == "right") {
      textAlign = love::Font::ALIGN_RIGHT;
    } else if (textAlignStr == "center") {
      textAlign = love::Font::ALIGN_CENTER;
    } else if (textAlignStr == "justify") {
      textAlign = love::Font::ALIGN_JUSTIFY;
    }

    color[0] = 0.0;
    color[1] = 0.0;
    color[2] = 0.0;

    auto colorStr = reader.str("color");
    if (colorStr) {
      int num = std::stoi(std::string(*colorStr).substr(1), nullptr, 16);
      DrawUtil::hexToRGBFloat(num, color);
    }
  }

  void render() {
    auto fontPixelScale = float(lv.window.getDPIScale());
    auto worldFontSize = std::clamp(fontSize, 1.0f, 30.0f) / 10;
    if (!font) {
      font = TextBehavior::getFont(
          TextBehavior::getFontResource(fontFamily), worldFontSize * fontPixelScale);
    }
    auto downscale = 100.0 * worldFontSize / font->getHeight();

    auto wrap = width / downscale;

    lv.graphics.setColor({ color[0], color[1], color[2], 1.0 });
    lv.graphics.scale(downscale, downscale);

    lv.graphics.setFont(font);
    lv.graphics.printf(
        { { text, { 1, 1, 1, 1 } } }, wrap, textAlign, love::Matrix4(0, 0, 0, 1, 1, 0, 0, 0, 0));
  }
};

std::shared_ptr<CoreView> CoreViews::getViewForType(std::string viewType) {
  if (viewType == "image") {
    return std::make_shared<ImageView>();
  } else if (viewType == "text") {
    return std::make_shared<TextView>();
  } else {
    return std::make_shared<View>();
  }
}
