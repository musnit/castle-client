#!/usr/bin/env node

const Axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_HOST = 'https://api.castle.xyz';
// const API_HOST = 'http://localhost:1380';

async function runAsync() {
  const outFilename = process.argv[3] || 'test-watch.json';
  let result;
  const id = process.argv[2];

  try {
    const response = await Axios.post(
      `${API_HOST}/graphql`,
      {
        operationName: null,
        variables: { id },
        query: `
          query GetDeckInitialCardSceneData($id: ID!) {
            deck(deckId: $id) {
              variables
              initialCard {
                sceneData
              }
            }
          }
        `,
      },
      {
        headers: {
          'X-Enable-Scene-Creator-Migrations': true,
          'X-Castle-Skip-Cache': true,
        },
      }
    );
    result = response.data.data.deck;
  } catch (e) {}

  if (result) {
    fs.writeFileSync(path.join(__dirname, '../' + outFilename), JSON.stringify(result, null, 2));
  } else {
    console.log("Couldn't find any deck with this id...");
  }
}

runAsync();
