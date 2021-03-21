#include "engine.h"


//
// JavaScript utilities (stubs in not-web)
//

#ifdef __EMSCRIPTEN__
// In web use
// https://emscripten.org/docs/porting/connecting_cpp_and_javascript/Interacting-with-code.html#interacting-with-code-call-javascript-from-native
#define JS_DEFINE(retType, name, ...) EM_JS(retType, name, __VA_ARGS__)
#else
// Not web. Make a stub that takes any arguments, does nothing, returns default value of `retType`
#define JS_DEFINE(retType, name, ...)                                                              \
  template<typename... Args>                                                                       \
  inline static retType name([[maybe_unused]] Args &&... args) {                                   \
    return retType();                                                                              \
  }
#endif
JS_DEFINE(int, JS_getCanvasWidth, (),
    { return document.querySelector("#canvas").getBoundingClientRect().width; });
JS_DEFINE(int, JS_getCanvasHeight, (),
    { return document.querySelector("#canvas").getBoundingClientRect().height; });
JS_DEFINE(void, JS_reload, (), { window.location.reload(); });


//
// Utilities from Ghost (old term for Castle's extended version of Love)
//

extern "C" double ghostScreenScaling; // Globally scales rendering and touch coordinates
extern "C" bool ghostChildWindowCloseEventReceived; // Whether the OS tried to close the window


//
// Constructor, destructor
//

Engine::Engine() {
  // SDL parameters
  SDL_SetHint(SDL_HINT_TOUCH_MOUSE_EVENTS, "0"); // Don't doublecount touches as mouse events

  // First timer step
  lv.timer.step();

  // Setup physics test
  {
    b2BodyDef bodyDef;
    bodyDef.position = b2Vec2(4, 1120.0 / 100 - 0.5);
    groundBody = world.CreateBody(&bodyDef);

    b2PolygonShape shape;
    shape.SetAsBox(4, 0.5);
    groundBody->CreateFixture(&shape, 0);
  }
}

Engine::~Engine() {
}


//
// Frame
//

bool Engine::frame() {
  // Based on the main loop from 'boot.lua' in the Love codebase

  // Update window size and screen scaling based on canvas in web. This will
  // generate an `SDL_WINDOWEVENT_RESIZED`, so we do it before the event pump
  // to let Love process that immediately.
#ifdef __EMSCRIPTEN__
  {
    auto w = JS_getCanvasWidth();
    auto h = JS_getCanvasHeight();
    if (w != prevWindowWidth || h != prevWindowHeight) {
      fmt::print("canvas resized to {}, {}\n", w, h);
      SDL_SetWindowSize(lv.window.getSDLWindow(), w, h);
      ghostScreenScaling = double(w) / 800;
      prevWindowWidth = w;
      prevWindowHeight = h;
    }
  }
#endif

  // Process events. Quit if the window was closed.
  lv.event.pump();
  lv.event.clear();
  if (ghostChildWindowCloseEventReceived) {
    return false;
  }

  // Step timer and run update with the resulting `dt`
  update(lv.timer.step());

  // Draw
  lv.graphics.origin();
  lv.graphics.clear(love::Colorf(0, 0, 0, 1), {}, {});
  draw();
  lv.graphics.present(nullptr);

  return !shouldQuit;
}


//
// Update
//

void Engine::update([[maybe_unused]] double dt) {
  // Reload on Ctrl+R
  if (lv.keyboard.isDown({ love::Keyboard::KEY_RCTRL, love::Keyboard::KEY_LCTRL })
      && lv.keyboard.isDown({ love::Keyboard::KEY_R })) {
    JS_reload();
  }

  // Update physics test
  {
    // Step world
    world.Step(dt, 6, 2);

    // Create / destroy boxes on click
    auto mouseDown = false;
    double mouseX, mouseY;
    if (lv.mouse.isDown({ 1 })) {
      mouseDown = true;
      lv.mouse.getPosition(mouseX, mouseY);
    } else if (lv.touch.getTouches().size() > 0) {
      mouseDown = true;
      auto &touch = lv.touch.getTouches()[0];
      mouseX = touch.x;
      mouseY = touch.y;
    }
    if (mouseDown && !prevMouseDown) {
      mouseX /= 100; // Scale down to physics coordinates
      mouseY /= 100;

      // See if we clicked on an existing box. If so, destroy that, else create new
      struct Callback : b2QueryCallback {
        b2Body *hit = nullptr;
        virtual bool ReportFixture(b2Fixture *fixture) override {
          hit = fixture->GetBody();
          return false;
        }
      };
      b2AABB aabb { b2Vec2(mouseX - 0.01, mouseY - 0.01), b2Vec2(mouseX + 0.01, mouseY + 0.01) };
      Callback cb;
      world.QueryAABB(&cb, aabb);
      if (cb.hit) {
        // Hit something, destroy it if it's a box
        auto tail = std::remove_if(boxBodies.begin(), boxBodies.end(), [&](const b2Body *body) {
          return body == cb.hit;
        });
        if (tail != boxBodies.end()) {
          boxBodies.erase(tail, boxBodies.end());
          world.DestroyBody(cb.hit);
        }
      } else {
        // Didn't hit anything, create new box

        b2BodyDef bodyDef;
        bodyDef.type = b2_dynamicBody;
        bodyDef.position = b2Vec2(mouseX, mouseY);
        auto boxBody = world.CreateBody(&bodyDef);

        b2PolygonShape shape;
        shape.SetAsBox(0.25, 0.25);
        b2FixtureDef fixtureDef;
        fixtureDef.shape = &shape;
        fixtureDef.density = 1;
        fixtureDef.friction = 0.3;
        boxBody->CreateFixture(&fixtureDef);

        boxBodies.push_back(boxBody);
      }
    }
    prevMouseDown = mouseDown;
  }
}


//
// Draw
//

void Engine::draw() {
  lv.graphics.clear(love::Colorf(0.2, 0.2, 0.2, 1), {}, {});

  // Draw physics test
  {
    lv.graphics.push();

    lv.graphics.scale(100, 100);

    {
      auto [x, y] = groundBody->GetPosition();
      lv.graphics.setColor(love::Colorf(0.4, 0.4, 0.4, 1));
      lv.graphics.rectangle(love::Graphics::DrawMode::DRAW_FILL, x - 4, y - 0.5, 8, 1);
    }

    lv.graphics.setColor(love::Colorf(0.4, 0.4, 0.2, 1));
    for (auto &boxBody : boxBodies) {
      auto [x, y] = boxBody->GetPosition();
      lv.graphics.push();
      lv.graphics.translate(x, y);
      lv.graphics.rotate(boxBody->GetAngle());
      lv.graphics.rectangle(love::Graphics::DrawMode::DRAW_FILL, -0.25, -0.25, 0.5, 0.5);
      lv.graphics.pop();
    }

    lv.graphics.pop();
  }

  auto fps = fmt::format("fps: {}", lv.timer.getFPS());
  lv.graphics.setColor(love::Colorf(0, 0, 0, 1));
  lv.graphics.print(
      { { fps, { 1, 1, 1, 1 } } }, debugFont.get(), love::Matrix4(20, 20, 0, 1, 1, 0, 0, 0, 0));
}
