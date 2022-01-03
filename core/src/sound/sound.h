#pragma once

#include "precomp.h"

#include "soloud.h"
#include "soloud_sfxr.h"
#include "soloud_wavstream.h"

class Clock;
class Pattern;
class Instrument;
class Stream;

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

  void preload(const std::string &type, const std::string &recordingUrl,
      const std::string &uploadUrl, const std::string &category, int seed, int mutationSeed,
      int mutationAmount);
  void play(const std::string &type, float playbackRate, const std::string &recordingUrl,
      const std::string &uploadUrl, const std::string &category, int seed, int mutationSeed,
      int mutationAmount);

  void addClock(Clock *); // start audio thread if not started, add clock if not added
  void removeAllClocks(); // stop audio thread and unschedule all clocks
  void play(int clockId, Pattern &pattern, Instrument &instrument);

  static void clearCache() {
    sfxrSounds.clear();
    urlSounds.clear();

    if (hasInitializedSoloud) {
      soloud.stopAll();
    }
  }

  static void stopAll() {
    if (hasInitializedSoloud) {
      soloud.stopAll();
    }
  }

private:
  void initialize();
  void playUrl(float playbackRate, const std::string &url);
  void playEffect(float playbackRate, const std::string &category, int seed, int mutationSeed,
      int mutationAmount);

  class ClockThread : public love::thread::Threadable {
  public:
    ClockThread(Sound &owner_);
    virtual ~ClockThread() = default;
    void threadFunction();
    void addClock(Clock *);
    void addStream(int clockId, Pattern &pattern, Instrument &instrument);
    void finish();

  private:
    Sound &owner;
    love::timer::Timer timer;

    // clocks managed by this thread
    std::unordered_map<int, Clock *> clocks;

    // streams managed by this thread
    std::unordered_map<int, std::vector<std::unique_ptr<Stream>>> streams;

    volatile bool shouldFinish;
    love::thread::MutexRef mutex;
  };

  ClockThread *clockThread = nullptr;
};
