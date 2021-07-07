#include "library.h"

#include "archive.h"


constexpr auto libraryEntryPoolChunkSize = 8 * 1024;


//
// Library entry constructor, destructor
//

LibraryEntry::LibraryEntry(const json::Value &jsonValue_, json::CrtAllocator &baseAlloc)
    : alloc(libraryEntryPoolChunkSize, &baseAlloc)
    , jsonValue(jsonValue_, alloc, true) {
}


//
// Entry update
//

void Library::readEntry(Reader &reader) {
  auto maybeEntryId = reader.str("entryId");
  if (!maybeEntryId) {
    Debug::log("tried to read library entry without `entryId`!");
    return;
  }
  auto entryId = *maybeEntryId;
  entries.emplace(std::piecewise_construct, std::forward_as_tuple(entryId),
      std::forward_as_tuple(*reader.jsonValue(), baseAlloc));
}
