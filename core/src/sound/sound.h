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
  inline static SoLoud::Soloud soloud;
  inline static std::unordered_map<std::string, std::unique_ptr<SoLoud::Sfxr>> sfxrSounds;
  inline static std::unordered_map<std::string, std::unique_ptr<SoLoud::WavStream>> urlSounds;

public:
  Sound(const Sound &) = delete; // Prevent accidental copies
  Sound &operator=(const Sound &) = delete;
  Sound(Sound &&) = default; // Allow moves
  Sound &operator=(Sound &&) = default;

  Sound();
  ~Sound();

  void preload(const Sample &sample);
  void play(const Sample &sample, double playbackRate);

  void addClock(Clock *); // start audio thread if not started, add clock if not added
  void removeAllClocks(); // stop audio thread and unschedule all clocks

  struct StreamOptions {
    double initialTimeInStream = 0; // to start partway thru stream
    bool quantize = false; // to delay the start until the next clock unit
    Clock::Quantize quantizeUnits = Clock::Quantize::Bar;
  };
  // schedule a pattern on the given clock; clock takes ownership of pattern
  // return a streamId
  int play(
      int clockId, std::unique_ptr<Pattern> pattern, Instrument &instrument, StreamOptions opts);

  static void clearCache() {
    sfxrSounds.clear();
    urlSounds.clear();

    if (hasInitializedSoloud) {
      soloud.stopAll();
    }
  }

  void stopAll();
  void clearStreams();
  void stopStream(int clockId, int streamId);

private:
  void initialize();
  void playUrl(float playbackRate, const std::string &url);
  void playEffect(float playbackRate, const std::string &category, int seed, int mutationSeed,
      int mutationAmount);
  void playTone(float playbackRate, int midiNote, const std::string &waveform, float attack,
      float sustain, float release);

  class ClockThread : public love::thread::Threadable {
  public:
    ClockThread(Sound &owner_);
    virtual ~ClockThread() = default;
    void threadFunction();
    void addClock(Clock *);
    int addStream(
        int clockId, std::unique_ptr<Pattern> pattern, Instrument &instrument, StreamOptions opts);
    void clearStreams();
    void stopStream(int clockId, int streamId);
    void finish();

  private:
    Sound &owner;
    love::timer::Timer timer;

    // clocks managed by this thread
    std::unordered_map<int, Clock *> clocks;

    // streams managed by this thread
    std::unordered_map<int, std::vector<std::unique_ptr<Stream>>> streams;

    volatile bool shouldFinish = false;
    love::thread::MutexRef mutex;
  };

  ClockThread *clockThread = nullptr;
};
