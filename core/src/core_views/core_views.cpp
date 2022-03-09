#include "core_views.h"
#include "editor/draw/util.h"
#include "api.h"
#include "behaviors/text.h"
#include "utils/embedded_image.h"

#ifdef __EMSCRIPTEN__
#include "core_views_json.h"
#endif

#define TOUCH_DOWN_ALPHA 0.7f

extern "C" double ghostScreenScaling;

namespace CastleCore {
const char *getAssetsDirectoryPath();
}

//
// CoreViewRenderer
//

void CoreViewRenderer::render() {
  if (jsonVersion != CoreViews::getInstance().jsonVersion) {
    jsonVersion = CoreViews::getInstance().jsonVersion;

    layout = CoreViews::getInstance().getView(layoutTemplateName, &props, width, height);
  }

  renderView(layout.get(), 0, 0);
}

void CoreViewRenderer::renderView(CoreView *view, float currentLeft, float currentTop) {
  if (!view) {
    return;
  }
  if (!view->isVisible) {
    return;
  }

  lv.graphics.push(love::Graphics::STACK_ALL);
  viewTransform.reset();
  viewTransform.translate(view->left, view->top);
  view->absoluteLeft = currentLeft + view->left;
  view->absoluteTop = currentTop + view->top;
  lv.graphics.applyTransform(&viewTransform);

  view->baseRender();

  for (size_t i = 0; i < view->children.size(); i++) {
    renderView(view->children[i].get(), currentLeft + view->left, currentTop + view->top);
  }

  lv.graphics.pop();
}

void CoreViewRenderer::runAnimation(std::string viewId, std::string key, float duration,
    const std::function<std::string(float)> easingFunction) {
  animations.push_back(new CoreViewAnimation(viewId, key, duration, easingFunction));
}

void CoreViewRenderer::update(double dt) {
  auto it = animations.begin();
  while (it != animations.end()) {
    auto animation = *it;
    animation->time += dt;
    if (animation->time > animation->duration) {
      delete animation;
      it = animations.erase(it);
    } else {
      auto value = animation->easingFunction(animation->time / animation->duration);
      updateProp(animation->viewId, animation->key, value);
      ++it;
    }
  }
}

struct CoreViewsGestureEvent {
  PROP(std::string, gestureHandlerId);
  PROP(std::string, props);
};

void CoreViewRenderer::handleGesture(Gesture &gesture, int offsetX, int offsetY) {
  gesture.withSingleTouch([&](const Touch &touch) {
    if (touch.isUsed() && !touch.isUsed(TextBehavior::leaderboardTouchToken)) {
      return;
    }

    if (touch.pressed) {
      touchView
          = getViewAtPoint(layout.get(), touch.screenPos.x - offsetX, touch.screenPos.y - offsetY);
      if (touchView) {
        isTouchOverView = true;
        (*touchView)->baseHandleTouch(CoreView::TouchEvent::Down);
        touch.use(TextBehavior::leaderboardTouchToken);
      }
    }

    if (!touchView) {
      return;
    }

    auto newTouchView
        = getViewAtPoint(layout.get(), touch.screenPos.x - offsetX, touch.screenPos.y - offsetY);
    bool newIsTouchOverView = newTouchView == touchView;

    if (isTouchOverView && !newIsTouchOverView) {
      (*touchView)->baseHandleTouch(CoreView::TouchEvent::Up);
    } else if (!isTouchOverView && newIsTouchOverView) {
      (*touchView)->baseHandleTouch(CoreView::TouchEvent::Down);
    }

    isTouchOverView = newIsTouchOverView;

    if (touch.released) {
      if (isTouchOverView) {
        (*touchView)->baseHandleTouch(CoreView::TouchEvent::Up);
        (*touchView)->baseHandleTouch(CoreView::TouchEvent::Tap);

        if ((*touchView)->id && tapHandler) {
          (*tapHandler)(*(*touchView)->id);
        }

        if ((*touchView)->onTapHandlerId) {
          CoreViewsGestureEvent ev;
          ev.gestureHandlerId = *((*touchView)->onTapHandlerId);

          Archive archive;
          archive.write([&](Archive::Writer &writer) {
            for (auto it = jsGestureProps.cbegin(); it != jsGestureProps.cend(); ++it) {
              writer.str(it->first, it->second);
            }

            writer.num("left", (*touchView)->absoluteLeft * ghostScreenScaling);
            writer.num("top", (*touchView)->absoluteTop * ghostScreenScaling);
            writer.num("width", (*touchView)->width * ghostScreenScaling);
            writer.num("height", (*touchView)->height * ghostScreenScaling);
          });

          ev.props = archive.toJson();
          bridge.sendEvent("CORE_VIEWS_GESTURE", ev);
        }
      }

      touchView = std::nullopt;
      isTouchOverView = false;
    }
  });
}

void CoreViewRenderer::cancelGestures() {
  if (touchView && isTouchOverView) {
    (*touchView)->baseHandleTouch(CoreView::TouchEvent::Up);
  }

  touchView = std::nullopt;
  isTouchOverView = false;
}

void CoreViewRenderer::registerTapHandler(const std::function<void(std::string)> handler_) {
  tapHandler = handler_;
}

void CoreViewRenderer::reset() {
  props.clear();
  jsGestureProps.clear();
  jsonVersion--;
  isTouchOverView = false;
}

void CoreViewRenderer::lock() {
  mutex.lock();
}

void CoreViewRenderer::unlock() {
  mutex.unlock();
}

void CoreViewRenderer::updateProp(
    std::string viewId, std::string key, std::string value, bool force) {
  if (!force && props[viewId][key] == value) {
    return;
  }

  props[viewId][key] = value;

  auto views = getViewForId(layout.get(), viewId);
  if (!views) {
    return;
  }

  Archive archive;
  archive.write([&](Archive::Writer &writer) {
    writer.str(key.c_str(), value.c_str());
  });

  archive.read([&](Reader &reader) {
    (views->first)->baseRead(reader, views->second, nullptr);
  });
}

std::string CoreViewRenderer::getProp(std::string viewId, std::string key) {
  if (props.find(viewId) == props.end()) {
    return "";
  }

  if (props[viewId].find(key) == props[viewId].end()) {
    return "";
  }

  return props[viewId][key];
}

void CoreViewRenderer::updateJSGestureProp(std::string key, std::string value) {
  jsGestureProps[key] = value;
}

// view, parent
std::optional<std::pair<CoreView *, CoreView *>> CoreViewRenderer::getViewForId(
    CoreView *root, std::string id) {
  if (root->id == id) {
    return std::make_pair(root, nullptr);
  }

  for (size_t i = 0; i < root->children.size(); i++) {
    auto childResult = getViewForId(root->children[i].get(), id);
    if (childResult) {
      return std::make_pair(childResult->first, root);
    }
  }

  return std::nullopt;
}

std::optional<CoreView *> CoreViewRenderer::getViewAtPoint(CoreView *root, float x, float y) {
  if (!root->isVisible) {
    return std::nullopt;
  }

  if (x >= root->left && x <= root->left + root->width && y >= root->top
      && y <= root->top + root->height) {
    for (int i = root->children.size() - 1; i >= 0; i--) {
      auto childResult = getViewAtPoint(root->children[i].get(), x - root->left, y - root->top);
      if (childResult) {
        return childResult;
      }
    }

    if (root->isTouchEnabled) {
      return root;
    } else {
      return std::nullopt;
    }
  } else {
    return std::nullopt;
  }
}

CoreView &CoreViewRenderer::getView(std::string viewId) {
  auto views = getViewForId(layout.get(), viewId);
  return *(views->first);
}

//
// CoreViews
//

CoreViews::CoreViews(Bridge &bridge_)
    : bridge(bridge_) {
  instance = this;

#ifdef __EMSCRIPTEN__
  setJson(CORE_VIEWS_JSON);
#endif
}

void CoreViews::setJson(std::string json) {
  if (json != jsonString) {
    jsonString = json;
    jsonVersion++;

    numConstantsCache.clear();
  }
}

std::shared_ptr<CoreViewRenderer> CoreViews::getRenderer(
    std::string layoutTemplateName, int viewportWidth, int viewportHeight) {
  return std::make_shared<CoreViewRenderer>(bridge, layoutTemplateName,
      getView(layoutTemplateName, nullptr, viewportWidth, viewportHeight), jsonVersion,
      viewportWidth, viewportHeight);
}

std::shared_ptr<CoreView> CoreViews::getView(std::string layoutTemplateName,
    std::unordered_map<std::string, std::unordered_map<std::string, std::string>> *props,
    int viewportWidth, int viewportHeight) {
  auto archive = Archive::fromJson(jsonString.c_str());
  std::shared_ptr<CoreView> result = nullptr;

  archive.read([&](Reader &reader) {
    reader.obj(layoutTemplateName.c_str(), [&]() {
      result = readViewFromJson(reader, nullptr, props, viewportWidth, viewportHeight);
    });
  });

  return result;
}

std::shared_ptr<CoreView> CoreViews::readViewFromJson(Reader &reader, CoreView *parent,
    std::unordered_map<std::string, std::unordered_map<std::string, std::string>> *props,
    int viewportWidth, int viewportHeight) {
  auto type = reader.str("type", "");
  auto view = getViewForType(type);
  view->baseRead(reader, parent, props, viewportWidth, viewportHeight);

  if (view->id && props && props->find(*(view->id)) != props->end()) {
    auto viewProps = (*props)[*(view->id)];

    Archive archive;
    archive.write([&](Archive::Writer &writer) {
      for (auto it = viewProps.cbegin(); it != viewProps.cend(); ++it) {
        writer.str(it->first, it->second);
      }
    });

    archive.read([&](Reader &reader) {
      view->baseRead(reader, nullptr, props, viewportWidth, viewportHeight);
    });
  }

  return view;
}

void CoreViews::hexToRGBFloat(std::string hex, float *out) {
  if (hex.at(0) == '#') {
    hex = hex.substr(1);
  }

  unsigned int rgb[3];
  rgb[0] = 0;
  rgb[1] = 0;
  rgb[2] = 0;

  if (hex.length() == 6) {
    sscanf(hex.c_str(), "%02x%02x%02x", &rgb[0], &rgb[1], &rgb[2]);
  } else if (hex.length() == 3) {
    sscanf(hex.c_str(), "%01x%01x%01x", &rgb[0], &rgb[1], &rgb[2]);
    rgb[0] = (rgb[0] + 1) * 16 - 1;
    rgb[1] = (rgb[1] + 1) * 16 - 1;
    rgb[2] = (rgb[2] + 1) * 16 - 1;
  }

  out[0] = rgb[0] / 255.0;
  out[1] = rgb[1] / 255.0;
  out[2] = rgb[2] / 255.0;
}

float CoreViews::getNumConstant(std::string key) {
  if (numConstantsCache.find(key) == numConstantsCache.end()) {
    auto archive = Archive::fromJson(jsonString.c_str());
    std::shared_ptr<CoreView> result = nullptr;

    archive.read([&](Reader &reader) {
      reader.obj("CONSTANTS", [&]() {
        numConstantsCache[key] = reader.num(key.c_str(), 0);
      });
    });
  }

  return numConstantsCache[key];
}

int CoreViews::readInt(
    Reader &reader, const char *key, float scale, int viewportWidth, int viewportHeight) {
  auto num = reader.num(key);
  if (num) {
    return *num;
  } else {
    auto cStr = reader.str(key);
    if (cStr) {
      std::string str = *cStr;

      if (str.length() > 0 && str.at(str.length() - 1) == '%') {
        auto percentStr = str.substr(0, str.length() - 1);
        auto percent = std::stof(percentStr);
        return percent * 0.01 * scale;
      }

      if (str.length() > 1 && str.substr(str.length() - 2) == "vw") {
        auto numStr = str.substr(0, str.length() - 2);
        auto num = std::stof(numStr);
        return viewportWidth * 0.01 * num;
      }

      if (str.length() > 1 && str.substr(str.length() - 2) == "vh") {
        auto numStr = str.substr(0, str.length() - 2);
        auto num = std::stof(numStr);
        return viewportHeight * 0.01 * num;
      }

      return std::stoi(str);
    }
  }

  return 0;
}

float CoreViews::readFloat(
    Reader &reader, const char *key, float scale, int viewportWidth, int viewportHeight) {
  auto num = reader.num(key);
  if (num) {
    return *num;
  } else {
    auto cStr = reader.str(key);
    if (cStr) {
      std::string str = *cStr;

      if (str.length() > 0 && str.at(str.length() - 1) == '%') {
        auto percentStr = str.substr(0, str.length() - 1);
        auto percent = std::stof(percentStr);
        return percent * 0.01 * scale;
      }

      if (str.length() > 1 && str.substr(str.length() - 2) == "vw") {
        auto numStr = str.substr(0, str.length() - 2);
        auto num = std::stof(numStr);
        return viewportWidth * 0.01 * num;
      }

      if (str.length() > 1 && str.substr(str.length() - 2) == "vh") {
        auto numStr = str.substr(0, str.length() - 2);
        auto num = std::stof(numStr);
        return viewportHeight * 0.01 * num;
      }

      return std::stof(str);
    }
  }

  return 0.0;
}

//
// Views
//

void CoreView::baseRead(Reader &reader, CoreView *parent,
    std::unordered_map<std::string, std::unordered_map<std::string, std::string>> *props,
    int viewportWidth, int viewportHeight) {
  int parentWidth = parent ? parent->width : viewportWidth;
  int parentHeight = parent ? parent->height : viewportHeight;

  if (reader.has("width")) {
    width = CoreViews::getInstance().readInt(
        reader, "width", parentWidth, viewportWidth, viewportHeight);
    savedWidth = width;
  }
  if (reader.has("height")) {
    height = CoreViews::getInstance().readInt(
        reader, "height", parentHeight, viewportWidth, viewportHeight);
    savedHeight = height;
  }

  if (reader.has("left")) {
    left = CoreViews::getInstance().readInt(
        reader, "left", parentWidth, viewportWidth, viewportHeight);
    savedLeft = left;
  } else if (reader.has("right")) {
    left = parentWidth
        - CoreViews::getInstance().readInt(
            reader, "right", parentWidth, viewportWidth, viewportHeight)
        - width;
    savedLeft = left;
  }

  if (reader.has("top")) {
    top = CoreViews::getInstance().readInt(
        reader, "top", parentHeight, viewportWidth, viewportHeight);
    savedTop = top;
  } else if (reader.has("bottom")) {
    top = parentHeight
        - CoreViews::getInstance().readInt(
            reader, "bottom", parentHeight, viewportWidth, viewportHeight)
        - height;
    savedTop = top;
  }

  if (reader.has("scale")) {
    float scale
        = CoreViews::getInstance().readFloat(reader, "scale", 1.0, viewportWidth, viewportHeight);
    float newWidth = savedWidth * scale;
    float newHeight = savedHeight * scale;

    left = savedLeft - (newWidth - savedWidth) * 0.5;
    top = savedTop - (newHeight - savedHeight) * 0.5;

    width = newHeight;
    height = newHeight;
  }

  if (reader.has("id")) {
    id = reader.str("id");
  }

  if (reader.has("onTapHandlerId")) {
    onTapHandlerId = reader.str("onTapHandlerId");
  }

  if (reader.has("borderRadius")) {
    borderRadius = CoreViews::getInstance().readFloat(
        reader, "borderRadius", 1.0, viewportWidth, viewportHeight);
  }

  auto backgroundColorStr = reader.str("backgroundColor");
  if (backgroundColorStr) {
    hasBackgroundColor = true;
    CoreViews::hexToRGBFloat(*backgroundColorStr, backgroundColor);
  }

  if (reader.has("children")) {
    reader.arr("children", [&]() {
      reader.each([&]() {
        children.push_back(CoreViews::getInstance().readViewFromJson(
            reader, this, props, viewportWidth, viewportHeight));
      });
    });
  }

  if (reader.has("visibility")) {
    std::string visibility = reader.str("visibility", "visible");
    isVisible = visibility == "visible";
  }

  if (reader.has("touch")) {
    std::string touch = reader.str("touch", "enabled");
    isTouchEnabled = touch == "enabled";
  }

  read(reader, viewportWidth, viewportHeight);
}

void CoreView::baseRender() {
  if (hasBackgroundColor) {
    if (borderRadius > 0) {
      if (!borderRadiusColorShader) {
        static const char vert[] = R"(
          vec4 position(mat4 transformProjection, vec4 vertexPosition) {
            return transformProjection * vertexPosition;
          }
        )";
        static const char frag[] = R"(
          uniform float radius;
          uniform float width;
          uniform float height;

          vec4 effect(vec4 color, Image tex, vec2 texCoords, vec2 screenCoords) {
            float x = texCoords.x * width;
            float y = texCoords.y * height;
            vec2 coord = vec2(x, y);

            if (x < radius && y < radius && distance(coord, vec2(radius, radius)) > radius) {
              discard;
            }

            if (x < radius && y > height - radius && distance(coord, vec2(radius, height - radius)) > radius) {
              discard;
            }

            if (x > width - radius && y < radius && distance(coord, vec2(width - radius, radius)) > radius) {
              discard;
            }

            if (x > width - radius && y > height - radius && distance(coord, vec2(width - radius, height - radius)) > radius) {
              discard;
            }

            return color;
          }
        )";
        borderRadiusColorShader.reset(
            lv.graphics.newShader(lv.wrapVertexShaderCode(vert), lv.wrapFragmentShaderCode(frag)));
      }

      lv.graphics.setShader(borderRadiusColorShader.get());

      {
        auto info = borderRadiusColorShader->getUniformInfo("radius");
        info->floats[0] = borderRadius;
        borderRadiusColorShader->updateUniform(info, 1);
      }

      {
        auto info = borderRadiusColorShader->getUniformInfo("width");
        info->floats[0] = width;
        borderRadiusColorShader->updateUniform(info, 1);
      }

      {
        auto info = borderRadiusColorShader->getUniformInfo("height");
        info->floats[0] = height;
        borderRadiusColorShader->updateUniform(info, 1);
      }
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

    lv.graphics.setColor({ backgroundColor[0], backgroundColor[1], backgroundColor[2],
        isTouchDown ? TOUCH_DOWN_ALPHA : 1.0f });
    quad->draw(&lv.graphics, love::Matrix4(0, 0, 0, width, height, 0, 0, 0, 0));
  } else if (borderRadius > 0) {
    if (!borderRadiusImageShader) {
      static const char vert[] = R"(
        vec4 position(mat4 transformProjection, vec4 vertexPosition) {
          return transformProjection * vertexPosition;
        }
      )";
      static const char frag[] = R"(
        uniform float radius;
        uniform float width;
        uniform float height;
        uniform float alpha;

        vec4 effect(vec4 color, Image tex, vec2 texCoords, vec2 screenCoords) {
          float x = texCoords.x * width;
          float y = texCoords.y * height;
          vec2 coord = vec2(x, y);

          if (x < radius && y < radius && distance(coord, vec2(radius, radius)) > radius) {
            discard;
          }

          if (x < radius && y > height - radius && distance(coord, vec2(radius, height - radius)) > radius) {
            discard;
          }

          if (x > width - radius && y < radius && distance(coord, vec2(width - radius, radius)) > radius) {
            discard;
          }

          if (x > width - radius && y > height - radius && distance(coord, vec2(width - radius, height - radius)) > radius) {
            discard;
          }

          return vec4(Texel(tex, texCoords).rgb, alpha);
        }
      )";
      borderRadiusImageShader.reset(
          lv.graphics.newShader(lv.wrapVertexShaderCode(vert), lv.wrapFragmentShaderCode(frag)));
    }

    lv.graphics.setShader(borderRadiusImageShader.get());

    {
      auto info = borderRadiusImageShader->getUniformInfo("radius");
      info->floats[0] = borderRadius;
      borderRadiusImageShader->updateUniform(info, 1);
    }

    {
      auto info = borderRadiusImageShader->getUniformInfo("width");
      info->floats[0] = width;
      borderRadiusImageShader->updateUniform(info, 1);
    }

    {
      auto info = borderRadiusImageShader->getUniformInfo("height");
      info->floats[0] = height;
      borderRadiusImageShader->updateUniform(info, 1);
    }

    {
      auto info = borderRadiusImageShader->getUniformInfo("alpha");
      info->floats[0] = isTouchDown ? TOUCH_DOWN_ALPHA : 1.0f;
      borderRadiusImageShader->updateUniform(info, 1);
    }
  }

  render();

  lv.graphics.setShader();
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
  void read(Reader &reader, int viewportWidth, int viewportHeight) {
  }

  void render() {
  }
};

class ImageView : public CoreView {
public:
  ~ImageView() {
    if (byteData) {
      byteData->release();
    }

    if (imageData) {
      imageData->release();
    }

    if (image) {
      image->release();
    }
  }

  enum ResizeMode {
    Contain,
    Stretch,
  };

  love::Data *byteData = nullptr;
  love::image::ImageData *imageData = nullptr;
  love::graphics::Image *image = nullptr;
  ResizeMode resizeMode = ResizeMode::Stretch;

  void read(Reader &reader, int viewportWidth, int viewportHeight) {
    auto url = reader.str("url");
    if (url) {
      int myViewId = viewId;
      API::getData(*url, [myViewId, this](APIDataResponse &response) {
        if (response.success && isViewAlive[myViewId]) {
          love::data::DataModule *dataModule
              = love::Module::getInstance<love::data::DataModule>(love::Module::M_DATA);

          byteData = dataModule->newByteData(response.data, response.length);
          imageData = nullptr;
          image = nullptr;
        }
      });
    }

    auto filename = reader.str("filename");
    if (filename) {
      std::string filenameStr = *filename;
      byteData = EmbeddedImage::load(filenameStr);

      if (!byteData) {
        auto fullPath = CastleCore::getAssetsDirectoryPath() + std::string("/") + *filename;
        byteData = lv.filesystem.read(fullPath.c_str());
      }

      imageData = nullptr;
      image = nullptr;
    }

    if (reader.has("resizeMode")) {
      std::string resizeModeStr = reader.str("resizeMode", "stretch");
      if (resizeModeStr == "contain") {
        resizeMode = ResizeMode::Contain;
      } else {
        resizeMode = ResizeMode::Stretch;
      }
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
      f.min = love::graphics::Texture::FILTER_LINEAR;
      f.mag = love::graphics::Texture::FILTER_LINEAR;
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

    lv.graphics.setColor({ 1.0, 1.0, 1.0, isTouchDown ? TOUCH_DOWN_ALPHA : 1.0f });
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
  enum TextAlignVertical {
    Top,
    Center,
  };

  std::string text = "";
  mutable love::Font *font = nullptr;
  love::Font::AlignMode textAlign = love::Font::ALIGN_LEFT;
  TextAlignVertical textAlignVertical = TextAlignVertical::Top;
  float color[3] = { 0, 0, 0 };
  float fontSize = 10;
  std::string fontFamily = "Overlay";
  float fontPixelScale;
  float worldFontSize;
  float downscale;

  float getContentWidth() {
    createFont();

    int width = font->getWidth(text);
    return (float)width * downscale;
  }

  void read(Reader &reader, int viewportWidth, int viewportHeight) {
    if (reader.has("text")) {
      text = reader.str("text", "");
    }

    if (reader.has("fontSize")) {
      fontSize = CoreViews::getInstance().readFloat(
          reader, "fontSize", 1.0, viewportWidth, viewportHeight);
    }

    if (reader.has("fontFamily")) {
      fontFamily = reader.str("fontFamily", "Overlay");
    }

    if (reader.has("textAlign")) {
      std::string textAlignStr = reader.str("textAlign", "left");
      if (textAlignStr == "right") {
        textAlign = love::Font::ALIGN_RIGHT;
      } else if (textAlignStr == "center") {
        textAlign = love::Font::ALIGN_CENTER;
      } else if (textAlignStr == "justify") {
        textAlign = love::Font::ALIGN_JUSTIFY;
      }
    }

    if (reader.has("textAlignVertical")) {
      std::string textAlignVerticalStr = reader.str("textAlignVertical", "top");
      if (textAlignVerticalStr == "top") {
        textAlignVertical = TextAlignVertical::Top;
      } else if (textAlignVerticalStr == "center") {
        textAlignVertical = TextAlignVertical::Center;
      }
    }

    auto colorStr = reader.str("color");
    if (colorStr) {
      CoreViews::hexToRGBFloat(*colorStr, color);
    }
  }

  void render() {
    createFont();

    auto wrap = width / downscale;

    float y = 0;

    if (textAlignVertical == TextAlignVertical::Center) {
      y = (height - (downscale * font->getHeight())) * 0.5;
    }

    lv.graphics.setColor({ color[0], color[1], color[2], isTouchDown ? TOUCH_DOWN_ALPHA : 1.0f });
    lv.graphics.scale(downscale, downscale);

    lv.graphics.setFont(font);
    lv.graphics.printf(
        { { text, { 1, 1, 1, 1 } } }, wrap, textAlign, love::Matrix4(0, y, 0, 1, 1, 0, 0, 0, 0));
  }

private:
  void createFont() {
    fontPixelScale = float(lv.window.getDPIScale());
    worldFontSize = std::clamp(fontSize, 1.0f, 30.0f) / 10;
    if (!font) {
      font = TextBehavior::getFont(
          TextBehavior::getFontResource(fontFamily), worldFontSize * fontPixelScale);
    }
    downscale = 100.0 * worldFontSize / font->getHeight();
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
