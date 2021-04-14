#!/usr/bin/env node

const Axios = require('axios');
const fs = require('fs');
const path = require('path');

async function runAsync() {
  const outPath = process.argv[3] || '../assets/test-watch.json';
  let snapshot;

  try {
    // Try as card
    const response = await Axios.post('https://api.castle.xyz/graphql', {
      operationName: null,
      variables: {},
      query: `{\n  card(cardId: "${process.argv[2]}") {\n    sceneData\n  }\n}\n`,
    });
    snapshot = response.data.data.card.sceneData.snapshot;
  } catch (e) {
    // Try as deck
    try {
      const response = await Axios.post('https://api.castle.xyz/graphql', {
        operationName: null,
        variables: {},
        query: `{\n  deck(deckId: "${process.argv[2]}") {\n    initialCard { sceneData }\n  }\n}\n`,
      });
      snapshot = response.data.data.deck.initialCard.sceneData.snapshot;
    } catch (e) {}
  }

  if (snapshot) {
    fs.writeFileSync(path.join(__dirname, outPath), JSON.stringify(snapshot, null, 2));
  } else {
    console.log("Couldn't find any card or deck with this id...");
  }
}

runAsync();
