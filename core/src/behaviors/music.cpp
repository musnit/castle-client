#include "music.h"

void MusicBehavior::handleEnableComponent(ActorId actorId, MusicComponent &component) {
  auto &song = component.props.song();
  if (song.tracks.size() == 0) {
    auto defaultTrack = Song::makeDefaultTrack();
    song.tracks.push_back(std::move(defaultTrack));
  }
}
