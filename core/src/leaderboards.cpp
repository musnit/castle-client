#include "leaderboards.h"

// doesn't need to be too often, since we also send an update when the leaderboard is displayed
#define LEADERBOARD_FLUSH_INTERVAL 5.0

void Leaderboards::update(double dt) {
  timeSinceLastUpdateSent += dt;

  if (isDirty && timeSinceLastUpdateSent > LEADERBOARD_FLUSH_INTERVAL) {
    timeSinceLastUpdateSent = 0;
    isDirty = false;

    for (auto it : scores) {
      auto &score = it.second;

      if (score.isHighDirty || score.isLowDirty) {
        if (score.highScore == score.lowScore) {
          API::graphql("mutation {\n  saveVariableToLeaderboard(deckId: \"" + score.deckId
                  + "\", variable: \"" + score.variable
                  + "\", score: " + std::to_string(score.highScore) + ")\n}",
              [=](APIResponse &response) {
              });
        } else {
          if (score.isHighDirty) {
            API::graphql("mutation {\n  saveVariableToLeaderboard(deckId: \"" + score.deckId
                    + "\", variable: \"" + score.variable
                    + "\", score: " + std::to_string(score.highScore) + ")\n}",
                [=](APIResponse &response) {
                });
          }

          if (score.isLowDirty) {
            API::graphql("mutation {\n  saveVariableToLeaderboard(deckId: \"" + score.deckId
                    + "\", variable: \"" + score.variable
                    + "\", score: " + std::to_string(score.lowScore) + ")\n}",
                [=](APIResponse &response) {
                });
          }
        }

        scores[it.first].isHighDirty = false;
        scores[it.first].isLowDirty = false;
      }
    }
  }
}

void Leaderboards::saveVariable(std::string deckId, std::string variable, double score) {
  auto key = getKey(deckId, variable);
  if (scores.find(key) != scores.end()) {
    if (score > scores[key].highScore) {
      scores[key].highScore = score;
      scores[key].isHighDirty = true;
      isDirty = true;
    }

    if (score < scores[key].lowScore) {
      scores[key].lowScore = score;
      scores[key].isLowDirty = true;
      isDirty = true;
    }
  } else {
    LeaderboardScore leaderboardScore;
    leaderboardScore.deckId = deckId;
    leaderboardScore.variable = variable;
    leaderboardScore.highScore = score;
    leaderboardScore.lowScore = score;
    leaderboardScore.isHighDirty = true;
    leaderboardScore.isLowDirty = true;
    scores[key] = leaderboardScore;
    isDirty = true;
  }
}

void Leaderboards::getLeaderboard(std::string deckId, std::string variable, std::string type,
    std::string filter, const std::function<void(Reader &)> &callback) {
  auto key = getKey(deckId, variable);
  if (scores.find(key) == scores.end()) {
    API::graphql("{\n  leaderboard(deckId: \"" + deckId + "\", variable: \"" + variable
            + "\", type: " + type + ", filter: " + filter
            + ") {\n    list {\n place\n score\n user {\n username\n photo {\n "
              "smallAvatarUrl}}}\n  }\n}",
        [=](APIResponse &response) {
          if (response.success) {
            auto &reader = response.reader;
            reader.obj("data", [&]() {
              reader.obj("leaderboard", [&]() {
                callback(reader);
              });
            });
          }
        });
    return;
  }

  auto score = scores[key];
  double value = type == "high" ? score.highScore : score.lowScore;
  if (type == "high") {
    scores[key].isHighDirty = false;
  } else {
    scores[key].isLowDirty = false;
  }

  API::graphql("mutation {\n  leaderboardV2(deckId: \"" + deckId + "\", variable: \"" + variable
          + "\", type: " + type + ", filter: " + filter + ", score: " + std::to_string(value)
          + ") {\n    list {\n place\n score\n user {\n username\n photo {\n "
            "smallAvatarUrl}}}\n  }\n}",
      [=](APIResponse &response) {
        if (response.success) {
          auto &reader = response.reader;
          reader.obj("data", [&]() {
            reader.obj("leaderboardV2", [&]() {
              callback(reader);
            });
          });
        }
      });
}

std::string Leaderboards::getKey(std::string deckId, std::string variable) {
  return deckId + "::" + variable;
}
