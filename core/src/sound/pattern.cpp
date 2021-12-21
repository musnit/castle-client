#include "pattern.h"

void Pattern::toggleNote(double step, float key) {
  bool exists = false;
  auto foundNotesItr = notes.find(step);
  if (foundNotesItr != notes.end()) {
    auto &notesAtStep = foundNotesItr->second;
    Note noteToFind { step, key };
    auto found = std::find(notesAtStep.begin(), notesAtStep.end(), noteToFind);
    if (found != notesAtStep.end()) {
      exists = true;
      notesAtStep.erase(found);
      if (notesAtStep.size() < 1) {
        notes.erase(foundNotesItr);
      }
    }
  }
  if (!exists) {
    if (foundNotesItr == notes.end()) {
      notes.emplace(step, SmallVector<Note, 2>());
    }
    notes[step].push_back({ step, key });
  }
}
