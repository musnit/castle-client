#include "music.h"

void MusicBehavior::handleEnableComponent(ActorId actorId, MusicComponent &component) {
  auto &song = component.props.song();
  if (song.tracks.size() == 0) {
    auto emptyPattern = Song::makeEmptyPattern();
    auto defaultTrack = Song::makeDefaultTrack();
    defaultTrack->sequence.emplace(0, emptyPattern->patternId);
    song.patterns.emplace(emptyPattern->patternId, *emptyPattern);
    song.tracks.push_back(std::move(defaultTrack));
  }
}

std::string MusicBehavior::hash(const std::string &json) {
  auto hash = std::hash<std::string> {}(json);

  char str[256];
  snprintf(str, sizeof str, "%zu", hash);

  return std::string(str);
}
