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
