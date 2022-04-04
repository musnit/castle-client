#pragma once

#include "precomp.h"

#include "soloud.h"
#include "soloud_sfxr.h"
#include "soloud_wavstream.h"
#include "clock.h"

class Pattern;
class Instrument;
class Stream;
struct Sample;

class Sound {
  inline static bool hasInitializedSoloud = false;
  inline static int soloudRefs = 0;
  inline static SoLoud::Soloud soloud;
  inline static int sInstanceId = 0;
  inline static std::map<int, bool> isInstanceAlive;
  inline static std::map<int, bool> isInstanceRunning;
  int instanceId;

public:
  Sound(const Sound &) = delete; // Prevent accidental copies
  Sound &operator=(const Sound &) = delete;
  Sound(Sound &&) = default; // Allow moves
  Sound &operator=(Sound &&) = default;

  Sound();
  ~Sound();

  inline static bool isEnabled = true;

  // Sound lifecycle

  void addClock(Clock *); // manage this Clock

  // stop sounds, destroy thread, retain stream state
  void suspend();

  // start thread
  void resume();

  // stop sounds, destroy thread, destroy stream state
  void clear();

  // interrupt any individual sounds and discard any scheduled streams, causing immediate silence.
  // clock/thread state is maintained and time continues to pass.
  void stopCurrentlyPlayingSounds();

  // Playing individual sounds

  void preload(const Sample &sample);
  void play(const Sample &sample, double playbackRate, float amplitude);
  SoLoud::Sfxr *getOrMakeSfxrSourceForKey(
      const std::string &key, std::function<void(SoLoud::Sfxr *)> f);
  void playSfxr(const std::string &sfxrKey, float amplitude, float soloudClock = 0.0f);

  // Playing streams

  struct StreamOptions {
    double initialTimeInStream = 0; // to start partway thru stream
    bool quantize = false; // to delay the start until the next clock unit
    Clock::Quantize quantizeUnits = Clock::Quantize::Bar;
  };
  // schedule a pattern on the given clock; clock takes ownership of pattern
  // return a streamId
  int play(int clockId, std::unique_ptr<Pattern> pattern, std::unique_ptr<Instrument> instrument,
      StreamOptions opts);

  void clearStreams();
  void stopStream(int clockId, int streamId, StreamOptions opts);
  Stream *maybeGetStream(int clockId, int streamId);

protected:
  inline static void retainSoloud() {
    if (!hasInitializedSoloud) {
      hasInitializedSoloud = true;
      soloud.init();
    }
    soloudRefs++;
  }
  inline static void releaseSoloud() {
    soloudRefs--;
    if (soloudRefs == 0) {
      if (hasInitializedSoloud) {
        soloud.stopAll();
        soloud.deinit();
        hasInitializedSoloud = false;
      }
    }
  }

  friend struct SoundEnabledReceiver;
  bool isRunning = false;

  void playUrl(float playbackRate, float amplitude, const std::string &url);
  void playEffect(float playbackRate, float amplitude, const std::string &category, int seed,
      int mutationSeed, int mutationAmount);
  void playTone(float playbackRate, float amplitude, int midiNote, const std::string &waveform,
      float attack, float release);

  void setAllSoloudSourcesPaused(bool paused);

  inline int playSoloudSource(SoLoud::AudioSource &source, float playbackRate, float amplitude) {
    int handle;
    {
      love::thread::Lock lock(mutex);
      handle = Sound::soloud.play(source);
      Sound::soloud.setVolume(handle, amplitude);
      Sound::soloud.setRelativePlaySpeed(handle, playbackRate);
      if (!isRunning) {
        // pause by default if not running
        Sound::soloud.setPause(handle, 1);
      }
    }
    return handle;
  }

  // soloud sources managed by this sound instance
  std::unordered_map<std::string, std::unique_ptr<SoLoud::Sfxr>> sfxrSounds;
  std::unordered_map<std::string, std::unique_ptr<SoLoud::WavStream>> urlSounds;

  // clocks managed by this sound instance
  std::unordered_map<int, Clock *> clocks;

  // streams managed by this sound instance, grouped by clock
  std::unordered_map<int, std::vector<std::unique_ptr<Stream>>> streams;

  void markStreamPlayedNotesOnClock(Clock &clock, Stream &stream);

  class ClockThread : public love::thread::Threadable {
  public:
    ClockThread(Sound &owner_);
    virtual ~ClockThread() = default;
    void threadFunction();
    void finish();

  protected:
    Sound &owner;
    love::timer::Timer timer;

    volatile bool shouldFinish = false;
  };

  love::thread::MutexRef mutex;
  ClockThread *clockThread = nullptr;
};
