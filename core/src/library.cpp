#include "library.h"

#include "archive.h"


constexpr auto libraryEntryPoolChunkSize = 8 * 1024;


//
// Entry constructor, destructor
//

LibraryEntry::LibraryEntry(Scene &scene_, const char *entryId_, const json::Value &jsonValue_,
    json::CrtAllocator &baseAlloc)
    : scene(scene_)
    , alloc(libraryEntryPoolChunkSize, &baseAlloc)
    , jsonValue(jsonValue_, alloc, true)
    , entryId(entryId_) {
  read([&](Reader &reader) {
    title = reader.str("title", "");
  });
}


//
// Entry preview image
//

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
        love::Image::Slices slices(love::TEXTURE_2D);
        slices.set(0, 0, previewImageData.get());
        previewImage.reset(lv.graphics.newImage(slices, {}));
      }
    });
    previewImageGenerated = true;
  }
  return previewImage.get();
}


//
// Entry ghost actor
//

ActorId LibraryEntry::getGhostActorId() {
  if (!ghostActorCreated) {
    Scene::ActorDesc actorDesc;
    actorDesc.parentEntryId = entryId.c_str();
    actorDesc.isGhost = true;
    ghostActorId = scene.addActor(actorDesc);
    ghostActorCreated = true;
  }
  return ghostActorId;
}


//
// Entry reading
//

void Library::readEntry(Reader &reader) {
  auto maybeEntryId = reader.str("entryId");
  if (!maybeEntryId) {
    Debug::log("tried to read library entry without `entryId`!");
    return;
  }
  auto entryId = *maybeEntryId;
  entries.emplace(std::piecewise_construct, std::forward_as_tuple(entryId),
      std::forward_as_tuple(scene, entryId, *reader.jsonValue(), baseAlloc));
  markOrderDirty();
}


//
// Entry order
//

void Library::markOrderDirty() {
  order.clear(); // To avoid accidental access to stale `LibraryEntry *`s in `order`
  orderDirty = true;
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
