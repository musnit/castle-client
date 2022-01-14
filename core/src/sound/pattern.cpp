#include "pattern.h"
#include "clock.h"

Pattern::Pattern(const Pattern &other) {
  patternId = other.patternId;
  loop = other.loop;
  for (auto &[time, notesList] : other.notes) {
    notes[time] = notesList;
  }
}

const Pattern &Pattern::operator=(const Pattern &other) {
  patternId = other.patternId;
  loop = other.loop;
  for (auto &[time, notesList] : other.notes) {
    notes[time] = notesList;
  }
  return *this;
}

void Pattern::write(Writer &writer) const {
  switch (loop) {
  case Loop::None:
    writer.str("loop", "none");
    break;
  case Loop::NextBar:
    writer.str("loop", "nextBar");
    break;
  }
  writer.str("patternId", patternId);
  writer.write("notes", notes);
}

void Pattern::read(Reader &reader) {
  patternId = reader.str("patternId", "");
  auto loopStr = reader.str("loop", "nextBar");
  if (loopStr == "none") {
    loop = Loop::None;
  } else if (loopStr = "nextBar") {
    loop = Loop::NextBar;
  }
  reader.obj("notes", [&]() {
    reader.read(notes);
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
