#!/usr/bin/env node

const Axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_HOST = 'https://api.castle.xyz';
// const API_HOST = 'http://localhost:1380';

async function runAsync() {
  const outFilename = process.argv[3] || 'test-watch.json';
  let sceneData;
  const id = process.argv[2];

  try {
    // Try as card
    const response = await Axios.post(
      `${API_HOST}/graphql`,
      {
        operationName: null,
        variables: {},
        variables: { id },
        query: `
          query GetCardSceneData($id: ID!) {
            card(cardId: $id) {
              sceneData
            }
          }
        `,
      },
      {
        headers: {
          'X-Enable-Scene-Creator-Migrations': true,
        },
      }
    );
    sceneData = response.data.data.card.sceneData;
  } catch (e) {
    // Try as deck
    try {
      const response = await Axios.post(
        `${API_HOST}/graphql`,
        {
          operationName: null,
          variables: { id },
          query: `
            query GetDeckInitialCardSceneData($id: ID!) {
              deck(deckId: $id) {
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
          },
        }
      );
      sceneData = response.data.data.deck.initialCard.sceneData;
    } catch (e) {}
  }

  if (sceneData) {
    fs.writeFileSync(path.join(__dirname, '../' + outFilename), JSON.stringify(sceneData, null, 2));
  } else {
    console.log("Couldn't find any card or deck with this id...");
  }
}

runAsync();
