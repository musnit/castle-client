#pragma once

#include "precomp.h"

#include "api.h"

struct LeaderboardScore {
  std::string deckId;
  std::string variable;
  double highScore;
  double lowScore;
  bool isHighDirty;
  bool isLowDirty;
};

class Leaderboards {
public:
  void update(double dt);
  void saveVariable(std::string deckId, std::string variable, double score);
  void getLeaderboard(std::string deckId, std::string variable, std::string type,
      std::string filter, const std::function<void(Reader &)> &callback);

private:
  std::map<std::string, LeaderboardScore> scores;
  std::string getKey(std::string deckId, std::string variable);

  bool isDirty = false;
  double timeSinceLastUpdateSent = 0.0;
};
