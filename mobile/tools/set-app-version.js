let secret = require('../../../ghost-secret');
const fetch = require('node-fetch');

if (!secret.castle.castleAdminToken) {
  console.error(
    'set-app-version.js: admin token not found. please clone ghost-secret as a sibling to this repo'
  );
  process.exitCode = 1;
}
if (!process.env.CASTLE_OS || !process.env.CASTLE_VERSION) {
  console.error('set-app-version.js: CASTLE_OS and CASTLE_VERSION env vars are required');
  process.exitCode = 1;
} else {
  fetch('https://api.castle.xyz/graphql', {
    headers: {
      accept: '*/*',
      'accept-language': 'en-US,en;q=0.9',
      'content-type': 'application/json',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      'x-auth-token': secret.castle.castleAdminToken,
    },
    referrer: 'https://api.castle.xyz/graphql',
    referrerPolicy: 'strict-origin-when-cross-origin',
    body:
      '{"operationName":null,"variables":{},"query":"mutation {\\n  addClientRelease(os: \\"' +
      process.env.CASTLE_OS +
      '\\", buildVersionName: \\"' +
      process.env.CASTLE_VERSION +
      '\\")\\n}\\n"}',
    method: 'POST',
    mode: 'cors',
  }).then(async (response) => {
    try {
      let body = await response.json();

      if (response.ok && (!body.errors || body.errors.length === 0)) {
        console.log('succesfully updated the app version');
      } else {
        console.error('set-app-version.js: error updating app token');
        console.error(JSON.stringify(body));
        process.exitCode = 1;
      }
    } catch (e) {
      console.error('set-app-version.js: error in request ' + e.toString());
      process.exitCode = 1;
    }
  });
}
