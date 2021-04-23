#pragma once

#include "precomp.h"


template<typename Value>
class TokenMap {
  // A string->value map where a string must first have a 'token' generated before it can be looked
  // up. Once a token is generated, lookup by token is more performant than lookup by string in a
  // regular map (no string hashing or comparison). This is useful in scenarios where possible
  // strings to look up are known ahead of time and frequent lookups occur after, as happens in the
  // case of Castle's tags and variables systems. The token can be saved and used for later lookups.
  //
  // Values may be moved in memory as new entries are added, so pointers to values cannot be
  // depended upon in the long term. If you really need values to have a stable address, you could
  // allocate them elsewhere and just keep pointers to those values in this data structure (eg. by
  // using `std::unique_ptr<TheActualValue>` for `Value`).

public:
  struct Token {
    // Returned when a string is reserved. Can then be used to look up by that string.

  private:
    friend class TokenMap;

    explicit Token(int index_);

    int index;
  };


  Token getToken(const char *str); // Get the token for a string
  void insert(const Token &token, Value value); // Insert at given token -- no-op if token invalid
  Value *lookup(const Token &token); // Lookup by token -- `nullptr` if not present


private:
  struct Entry {
    std::optional<Value> value;
  };
  std::vector<Entry> entries;
  std::unordered_map<std::string, Token> tokens;
};


// Inlined implementations

template<typename Value>
TokenMap<Value>::Token::Token(int index_)
    : index(index_) {
}

template<typename Value>
typename TokenMap<Value>::Token TokenMap<Value>::getToken(const char *key) {
  if (auto found = tokens.find(key); found != tokens.end()) {
    return found->second;
  } else {
    entries.push_back(Entry { std::nullopt });
    Token token { int(entries.size()) - 1 };
    tokens.insert_or_assign(key, token);
    return token;
  }
}

template<typename Value>
void TokenMap<Value>::insert(const Token &token, Value value) {
  if (0 <= token.index && token.index < int(entries.size())) {
    entries[token.index].value = value;
  }
}

template<typename Value>
Value *TokenMap<Value>::lookup(const Token &token) {
  if (0 <= token.index && token.index < int(entries.size())) {
    if (auto &entry = entries[token.index]; entry.value) {
      return &(*entry.value);
    }
  }
  return nullptr;
}
