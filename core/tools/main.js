#!/usr/bin/env node

const Axios = require("axios");
const fs = require("fs");
const path = require("path");

async function runAsync() {
  const response = await Axios.post("https://api.castle.xyz/graphql", {
    operationName: null,
    variables: {},
    query: `{\n  card(cardId: "${process.argv[2]}") {\n    sceneData\n  }\n}\n`,
  });

  fs.writeFileSync(
    path.join(__dirname, "../assets/test-watch.json"),
    JSON.stringify(response.data.data.card.sceneData.snapshot, null, 2)
  );
}

runAsync();
