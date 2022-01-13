#include "pattern.h"
#include "clock.h"

Pattern::Pattern(const Pattern &other) {
  for (auto &[time, notesList] : other.notes) {
    notes[time] = notesList;
  }
}

void Pattern::write(Writer &writer) const {
  writer.write("notes", notes);
}

void Pattern::read(Reader &reader) {
  reader.each([&](const char *key) {
    if (std::string(key) == "notes") {
      reader.read(notes);
    }
  });
  for (auto &[time, notesAtTime] : notes) {
    for (auto &note : notesAtTime) {
      note.time = time;
    }
  }
}

double Pattern::getLoopLength(Clock &clock) {
  switch (loop) {
  case Loop::NextBar: {
    double barLength = double(clock.getBeatsPerBar()) * double(clock.getStepsPerBeat());
    double lastTimeInBar = (notes.size() > 0) ? notes.rbegin()->first : 0;
    return std::ceil((lastTimeInBar + 0.01) / barLength) * barLength;
  }
  case Loop::None:
    return 0;
  }
}

bool Pattern::hasNote(double step, float key) {
  auto foundNotesItr = notes.find(step);
  if (foundNotesItr != notes.end()) {
    auto &notesAtStep = foundNotesItr->second;
    Note noteToFind { step, key };
    auto found = std::find(notesAtStep.begin(), notesAtStep.end(), noteToFind);
    if (found != notesAtStep.end()) {
      return true;
    }
  }
  return false;
}

bool Pattern::addNote(double step, float key) {
  bool exists = false;
  auto foundNotesItr = notes.find(step);
  if (foundNotesItr != notes.end()) {
    auto &notesAtStep = foundNotesItr->second;
    Note noteToFind { step, key };
    auto found = std::find(notesAtStep.begin(), notesAtStep.end(), noteToFind);
    if (found != notesAtStep.end()) {
      exists = true;
    }
  }
  if (!exists) {
    if (foundNotesItr == notes.end()) {
      notes.emplace(step, SmallVector<Note, 2>());
    }
    notes[step].push_back({ step, key });
    return true;
  }
  return false;
}

bool Pattern::removeNote(double step, float key) {
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
  return exists;
}
