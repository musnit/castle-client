#include "editor.h"

Editor::Editor(Bridge &bridge_, Lv &lv_)
    : bridge(bridge_)
    , lv(lv_) {
}

void Editor::readScene(Reader &reader) {
  scene = std::make_unique<Scene>(bridge, variables, &reader);
  Debug::log("editor: read scene");
}

void Editor::readVariables(Reader &reader) {
  variables.read(reader);
};

void Editor::update(double dt) {
  // Update scene
  if (scene) {
    if (scene->isRestartRequested()) {
      sceneArchive.read([&](Reader &reader) {
        reader.obj("snapshot", [&]() {
          scene = std::make_unique<Scene>(bridge, variables, &reader);
        });
      });
    }

    Debug::display("fps: {}", lv.timer.getFPS());
    Debug::display("actors: {}", scene->numActors());

    scene->update(dt);
  }
}

void Editor::draw() {
  if (scene) {
    scene->draw();
  }
}
