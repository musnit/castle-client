#include "pattern.h"
#include "clock.h"
#include "editor/draw/util.h"

std::string Pattern::makePatternId() {
  static std::random_device rd;
  static uuids::basic_uuid_random_generator gen(rd);
  return uuids::to_string(gen());
}

std::unique_ptr<Pattern> Pattern::makeEmptyPattern() {
  auto pattern = std::make_unique<Pattern>();
  pattern->patternId = makePatternId();
  pattern->color = DrawUtil::getRandomCastlePaletteColor();
  return pattern;
}

std::unique_ptr<Pattern> Pattern::fork(Pattern &pattern) {
  auto fork = std::make_unique<Pattern>(pattern);
  fork->patternId = makePatternId();
  fork->color = DrawUtil::getRandomCastlePaletteColor();
  return fork;
}

double Pattern::getLoopLength(Clock &clock) {
  switch (loop()) {
  case Loop::NextBar: {
    double barLength = double(clock.getBeatsPerBar()) * double(clock.getStepsPerBeat());
    double lastTimeInBar = (notes().size() > 0) ? notes().rbegin()->first : 0;
    return std::ceil((lastTimeInBar + 0.01) / barLength) * barLength;
  }
  case Loop::ExplicitLength:
    return loopLength();
  case Loop::None:
    return 0;
  }
}

bool Pattern::hasNote(double step, float key) {
  auto foundNotesItr = notes().find(step);
  if (foundNotesItr != notes().end()) {
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
  auto foundNotesItr = notes().find(step);
  if (foundNotesItr != notes().end()) {
    auto &notesAtStep = foundNotesItr->second;
    Note noteToFind { step, key };
    auto found = std::find(notesAtStep.begin(), notesAtStep.end(), noteToFind);
    if (found != notesAtStep.end()) {
      exists = true;
    }
  }
  if (!exists) {
    if (foundNotesItr == notes().end()) {
      notes().emplace(step, SmallVector<Note, 2>());
    }
    notes()[step].push_back({ step, key });
    return true;
  }
  return false;
}

bool Pattern::removeNote(double step, float key) {
  bool exists = false;
  auto foundNotesItr = notes().find(step);
  if (foundNotesItr != notes().end()) {
    auto &notesAtStep = foundNotesItr->second;
    Note noteToFind { step, key };
    auto found = std::find(notesAtStep.begin(), notesAtStep.end(), noteToFind);
    if (found != notesAtStep.end()) {
      exists = true;
      notesAtStep.erase(found);
      if (notesAtStep.size() < 1) {
        notes().erase(foundNotesItr);
      }
    }
  }
  return exists;
}
