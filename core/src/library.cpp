#include "library.h"

#include "archive.h"
#include "behaviors/all.h"


constexpr auto libraryEntryPoolChunkSize = 8 * 1024;


//
// LibraryEntry
//

LibraryEntry::LibraryEntry(Library &library_, const char *entryId_, const json::Value &jsonValue_,
    json::CrtAllocator &baseAlloc)
    : library(library_)
    , alloc(libraryEntryPoolChunkSize, &baseAlloc)
    , jsonValue(jsonValue_, alloc, true)
    , entryId(entryId_) {
  read([&](Reader &reader) {
    title = reader.str("title", "");
  });
  disambiguateTitle();
}

LibraryEntry::~LibraryEntry() {
  if (library.scene.hasActor(ghostActorId)) {
    library.scene.removeActor(ghostActorId);
  }
}

love::Image *LibraryEntry::getPreviewImage() const {
  auto &lv = Lv::getInstance();
  if (!previewImageGenerated) {
    read([&](Reader &reader) {
      if (auto [base64Png, base64PngLength] = reader.strAndLength("base64Png"); base64Png) {
        size_t decodedLen = 0;
        auto decoded = love::data::decode(
            love::data::ENCODE_BASE64, *base64Png, base64PngLength, decodedLen);
        auto byteData
            = std::unique_ptr<love::ByteData>(lv.data.newByteData(decoded, decodedLen, true));
        previewImageData.reset(lv.image.newImageData(byteData.get()));
      } else {
        Scene::ActorDesc tempActorDesc;
        tempActorDesc.parentEntryId = entryId.c_str();
        auto tempActorId = library.scene.addActor(tempActorDesc);
        auto &textBehavior = library.scene.getBehaviors().byType<TextBehavior>();
        if (auto drawingComponent
            = library.scene.getBehaviors().byType<Drawing2Behavior>().maybeGetComponent(
                tempActorId)) {
          auto initialFrameZeroIndex = int(drawingComponent->props.initialFrame()) - 1;
          if (auto previewCanvas
              = drawingComponent->drawData->renderPreviewCanvas(initialFrameZeroIndex, -1)) {
            previewImageData.reset(previewCanvas->newImageData(&lv.image, 0, 0,
                { 0, 0, previewCanvas->getPixelWidth(), previewCanvas->getPixelHeight() }));
          }
        } else if (auto textComponent = textBehavior.maybeGetComponent(tempActorId)) {
          auto tappable = textBehavior.hasTapTrigger(tempActorId);
          if (!library.textPreviewCanvas) {
            love::Canvas::Settings settings;
            settings.width = int(library.textPreviewCanvasSize);
            settings.height = int(library.textPreviewCanvasSize);
            settings.dpiScale = 1;
            settings.msaa = 4;
            library.textPreviewCanvas.reset(lv.graphics.newCanvas(settings));
          }
          lv.renderTo(library.textPreviewCanvas.get(), [&]() {
            lv.graphics.push(love::Graphics::STACK_ALL);
            lv.graphics.origin();
            lv.graphics.clear(love::Colorf(0, 0, 0, 0), {}, {});
            if (tappable) {
              lv.graphics.setColor({ 0, 0, 0, 1 });
            } else {
              lv.graphics.setColor({ 1, 1, 1, 1 });
            }
            lv.graphics.rectangle(love::Graphics::DRAW_FILL, 0, 0, library.textPreviewCanvasSize,
                library.textPreviewCanvasSize, 0.8f * library.textPreviewOffset,
                0.8f * library.textPreviewOffset, 4);
            lv.graphics.setFont(library.textPreviewFont.get());
            if (auto &text = textComponent->props.content(); !text.empty()) {
              auto textColor = tappable ? love::Colorf(1, 1, 1, 1) : love::Colorf(0, 0, 0, 1);
              lv.graphics.setColor(textColor);
              std::vector<std::string> lines;
              library.textPreviewFont->getWrap(
                  { { text, { 1, 1, 1, 1 } } }, library.textPreviewSize, lines);
              for (auto i = 0; i < 4; ++i) {
                if (i >= int(lines.size())) {
                  break;
                }
                lv.graphics.print({ { lines[i], textColor } }, library.textPreviewFont.get(),
                    love::Matrix4(library.textPreviewOffset,
                        library.textPreviewOffset + library.textPreviewFontHeight * float(i), 0, 1,
                        1, 0, 0, 0, 0));
              }
            }
            lv.graphics.setLineWidth(3);
            if (tappable) {
              lv.graphics.setColor({ 1, 1, 1, 1 });
            } else {
              lv.graphics.setColor({ 0, 0, 0, 1 });
            }
            lv.graphics.rectangle(love::Graphics::DRAW_LINE, 2, 2,
                library.textPreviewCanvasSize - 4, library.textPreviewCanvasSize - 4,
                0.8f * library.textPreviewOffset, 0.8f * library.textPreviewOffset, 4);
            lv.graphics.pop();
          });
          previewImageData.reset(library.textPreviewCanvas->newImageData(&lv.image, 0, 0,
              { 0, 0, library.textPreviewCanvas->getPixelWidth(),
                  library.textPreviewCanvas->getPixelHeight() }));
        }
        library.scene.removeActor(tempActorId);
      }
    });
    if (previewImageData) {
      love::Image::Slices slices(love::TEXTURE_2D);
      slices.set(0, 0, previewImageData.get());
      previewImage.reset(lv.graphics.newImage(slices, {}));
    }
    previewImageGenerated = true;
  }
  return previewImage.get();
}

ActorId LibraryEntry::getGhostActorId() {
  if (!ghostActorCreated) {
    Scene::ActorDesc actorDesc;
    if (auto found = library.ghostActorIds.find(entryId); found != library.ghostActorIds.end()) {
      actorDesc.requestedActorId = found->second;
    }
    actorDesc.parentEntryId = entryId.c_str();
    actorDesc.isGhost = true;
    ghostActorId = library.scene.addActor(actorDesc);
    if (ghostActorId != actorDesc.requestedActorId) {
      library.ghostActorIds[entryId] = ghostActorId;
    }
    ghostActorCreated = true;
  }
  return ghostActorId;
}

void LibraryEntry::disambiguateTitle() {
  auto newTitle = title;
  const auto newTitleClashes = [&]() {
    // PERF: Store `titleHash` in entry to speed up this linear scan?
    for (auto &[entryId, entry] : library.entries) {
      if (&entry != this && entry.title == newTitle) {
        return true;
      }
    }
    return false;
  };
  if (!newTitleClashes()) {
    return;
  }
  auto newTitlePrefix = newTitle;
  while (newTitlePrefix.size() > 1 && std::isdigit(newTitlePrefix.back())) {
    newTitlePrefix.pop_back();
  }
  if (newTitlePrefix.empty()) {
    newTitlePrefix = "Object ";
  }
  if (newTitlePrefix.back() != ' ') {
    newTitlePrefix.push_back(' ');
  }
  auto newTitleSuffix = 1;
  do {
    ++newTitleSuffix;
    newTitle = newTitlePrefix + std::to_string(newTitleSuffix);
  } while (newTitleClashes());
  if (newTitle == title) {
    return;
  }
  title = newTitle;
  jsonValue["title"] = json::Value().SetString(
      newTitle.c_str(), static_cast<unsigned int>(newTitle.size()), alloc);
}


//
// Library
//

std::string Library::generateEntryId() {
  static std::random_device rd;
  static uuids::basic_uuid_random_generator gen(rd);
  auto result = uuids::to_string(gen());
  Debug::log("generated entry id: {}", result);
  return result;
}

void Library::readEntry(Reader &reader) {
  auto maybeEntryId = reader.str("entryId");
  if (!maybeEntryId) {
    Debug::log("tried to read library entry without `entryId`!");
    return;
  }
  auto entryId = *maybeEntryId;
  entries.erase(entryId);
  entries.emplace(std::piecewise_construct, std::forward_as_tuple(entryId),
      std::forward_as_tuple(*this, entryId, *reader.jsonValue(), baseAlloc));
  markDirty();
}

void Library::ensureGhostActorsExist() {
  forEachEntry([&](LibraryEntry &entry) {
    entry.getGhostActorId();
  });
}

void Library::markDirty() {
  order.clear(); // To avoid accidental access to stale `LibraryEntry *`s in `order`
  orderDirty = true;
  editorNeedsSend = true;
}

void Library::ensureOrder() {
  if (orderDirty) {
    order.clear();
    order.reserve(entries.size());
    for (auto &[entryId, entry] : entries) {
      order.push_back(&entry);
    }
    std::sort(order.begin(), order.end(), [&](const LibraryEntry *a, const LibraryEntry *b) {
      return a->title < b->title;
    });
    orderDirty = false;
  }
}
