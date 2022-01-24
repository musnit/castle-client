#include "core_views.h"
#include "editor/draw/util.h"
#include "api.h"

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

  view->render();

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
        (*touchView)->handleTouch(CoreView::TouchEvent::Down);
      }
    }

    if (!touchView) {
      return;
    }

    auto newTouchView = getViewAtPoint(layout, touch.screenPos.x, touch.screenPos.y);
    bool newIsTouchOverView = newTouchView == touchView;

    if (isTouchOverView && !newIsTouchOverView) {
      (*touchView)->handleTouch(CoreView::TouchEvent::Up);
    } else if (!isTouchOverView && newIsTouchOverView) {
      (*touchView)->handleTouch(CoreView::TouchEvent::Down);
    }

    isTouchOverView = newIsTouchOverView;

    if (touch.released) {
      (*touchView)->handleTouch(CoreView::TouchEvent::Up);

      if (isTouchOverView) {
        (*touchView)->handleTouch(CoreView::TouchEvent::Tap);

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
  view->readBaseProperties(reader);
  view->read(reader);
  return view;
}

//
// Views
//

void CoreView::readBaseProperties(Reader &reader) {
  x = reader.num("x", 0);
  y = reader.num("y", 0);
  width = reader.num("width", 0);
  height = reader.num("height", 0);
  id = reader.str("id");
  onTapHandlerId = reader.str("onTapHandlerId");
  if (reader.has("children")) {
    reader.arr("children", [&]() {
      reader.each([&]() {
        children.push_back(CoreViews::getInstance().readViewFromJson(reader));
      });
    });
  }
}

class View : public CoreView {
  bool hasBackgroundColor = false;
  float backgroundColor[3];
  bool isTouchDown = false;

  void read(Reader &reader) {
    auto backgroundColorStr = reader.str("backgroundColor");

    if (backgroundColorStr) {
      hasBackgroundColor = true;
      int num = std::stoi(std::string(*backgroundColorStr).substr(1), nullptr, 16);
      DrawUtil::hexToRGBFloat(num, backgroundColor);
    }
  }

  void handleTouch(TouchEvent touch) {
    if (touch == Down) {
      isTouchDown = true;
    } else if (touch == Up) {
      isTouchDown = false;
    }
  }

  void render() {
    if (hasBackgroundColor) {
      static auto quad = [&]() {
        std::vector<love::graphics::Vertex> quadVerts {
          { 0, 0, 0, 0, { 0xff, 0xff, 0xff, 0xff } },
          { 1, 0, 1, 0, { 0xff, 0xff, 0xff, 0xff } },
          { 1, 1, 1, 1, { 0xff, 0xff, 0xff, 0xff } },
          { 0, 1, 0, 1, { 0xff, 0xff, 0xff, 0xff } },
        };
        return lv.graphics.newMesh(quadVerts, love::graphics::PRIMITIVE_TRIANGLE_FAN,
            love::graphics::vertex::USAGE_STATIC);
      }();

      lv.graphics.setColor({ backgroundColor[0], backgroundColor[1], backgroundColor[2],
          isTouchDown ? 0.6f : 1.0f });
      quad->draw(&lv.graphics, love::Matrix4(0, 0, 0, width, height, 0, 0, 0, 0));
    }
  }
};

class ImageView : public CoreView {
  love::image::ImageData *imageData;
  love::graphics::Image *image;

  void read(Reader &reader) {
    auto url = reader.str("url",
        "https://castle.imgix.net/"
        "5562132302136c9371501abd5b48bcaa?auto=compress&fit=crop&min-w=420&ar=5:7&fm=png");

    API::getData(url, [=](APIDataResponse &response) {
      love::data::DataModule *dataModule
          = love::Module::getInstance<love::data::DataModule>(love::Module::M_DATA);

      auto byteData = dataModule->newByteData(response.data, response.length);
      // imageData = lv.image.newImageData(byteData);
      imageData = lv.image.newImageData(1350, 1890, love::PixelFormat::PIXELFORMAT_RGBA8);

      love::image::Pixel p;
      p.rgba8[0] = 0;
      p.rgba8[1] = 200;
      p.rgba8[2] = 0;
      p.rgba8[3] = 100;

      for (int x = 0; x < 100; x++) {
        for (int y = 0; y < 100; y++) {
          imageData->setPixel(x, y, p);
        }
      }
      /*
            imageData->floodFill(1, 1, nullptr, p, true);*/

      love::graphics::Image::Settings settings;

      love::graphics::Image::Slices slices(love::graphics::TEXTURE_2D);
      slices.set(0, 0, imageData);

      image = lv.graphics.newImage(slices, settings);
      love::graphics::Texture::Filter f = image->getFilter();
      f.min = love::graphics::Texture::FILTER_NEAREST;
      f.mag = love::graphics::Texture::FILTER_NEAREST;
      image->setFilter(f);
    });
  }

  void render() {
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

    love::image::Pixel p;
    imageData->getPixel(1, 1, p);

    lv.graphics.setColor({ 1.0, 1.0, 1.0, 1.0 });
    quad->setTexture(image);
    quad->draw(&lv.graphics, love::Matrix4(0, 0, 0, width, height, 0, 0, 0, 0));
    quad->setTexture(nullptr);
  }
};

std::shared_ptr<CoreView> CoreViews::getViewForType(std::string viewType) {
  return std::make_shared<View>();
}
