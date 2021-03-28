#include "library.h"

#include "archive.h"


//
// Library entry constructor, destructor
//

LibraryEntry::LibraryEntry(json::Value jsonValue_)
    : jsonValue(std::move(jsonValue_)) {
}


//
// Entry update
//

void Library::readEntry(Reader &reader) {
  auto maybeEntryId = reader.str("entryId");
  if (!maybeEntryId) {
    fmt::print("tried to read library entry without `entryId`!");
    return;
  }
  auto entryId = *maybeEntryId;
  json::Value jsonValue(*reader.jsonValue(), alloc, true);
  entries.insert_or_assign(entryId, LibraryEntry(std::move(jsonValue)));
}
