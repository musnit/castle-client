#!/usr/bin/env node

var fs = require('fs');
var request = require('request');

var token = process.env['TOKEN'];
var channelName = process.env['CHANNEL_NAME'];
var platform = process.env['PLATFORM'];
var filename = process.env['FILENAME'];

if (!token) {
  var tokenFilename = '../../../ghost-secret/ci-secret-file.txt';
  var token = fs.readFileSync(tokenFilename, 'utf8');
}

if (!channelName) {
  throw new Error('channel arg is required');
}

if (!platform) {
  throw new Error('platform is required');
}

if (!filename) {
  throw new Error('filename is required');
}

request.post(
  {
    url: 'https://api.castle.xyz/api/react-native-bundle/upload',
    headers: {
      'X-Auth-Token': token,
      'react-native-channel': channelName,
      platform: platform,
    },
    formData: {
      file: fs.createReadStream(filename),
    },
  },
  function(err, resp, body) {
    if (err || resp.statusCode != 200) {
      console.log('Error! ' + resp);
      process.exit(1);
    } else {
      console.log('Success!');
      process.exit(0);
    }
  }
);
