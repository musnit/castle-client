#!/usr/bin/env node

const Axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_HOST = 'https://api.castle.xyz';
// const API_HOST = 'http://localhost:1380';

async function runAsync() {
  const outFilename = process.argv[3] || 'test-watch.json';
  let snapshot;

  try {
    // Try as card
    const response = await Axios.post(
      `${API_HOST}/graphql`,
      {
        operationName: null,
        variables: {},
        query: `{\n  card(cardId: "${process.argv[2]}") {\n    sceneData\n  }\n}\n`,
      },
      {
        headers: {
          'X-Enable-Scene-Creator-Migrations': true,
        },
      }
    );
    snapshot = response.data.data.card.sceneData.snapshot;
  } catch (e) {
    // Try as deck
    try {
      const response = await Axios.post(
        `${API_HOST}/graphql`,
        {
          operationName: null,
          variables: {},
          query: `{\n  deck(deckId: "${process.argv[2]}") {\n    initialCard { sceneData }\n  }\n}\n`,
        },
        {
          headers: {
            'X-Enable-Scene-Creator-Migrations': true,
          },
        }
      );
      snapshot = response.data.data.deck.initialCard.sceneData.snapshot;
    } catch (e) {}
  }

  if (snapshot) {
    fs.writeFileSync(
      path.join(__dirname, '../assets/' + outFilename),
      JSON.stringify(snapshot, null, 2)
    );
  } else {
    console.log("Couldn't find any card or deck with this id...");
  }
}

runAsync();
