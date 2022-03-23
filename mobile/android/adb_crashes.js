#!/usr/bin/env node

const { spawn } = require('child_process');

let inCrash = false;
let startedBacktrace = false;
function printLine(line) {
  if (line.includes('I castle-core:')) {
    console.log('');
    console.log('\x1b[4m%s\x1b[0m', line);
    console.log('');
    return;
  }

  if (!inCrash) {
    if (line.includes('Build fingerprint')) {
      console.log('\n\n\n');
      inCrash = true;
      startedBacktrace = false;
    }
  }

  if (inCrash) {
    if (startedBacktrace) {
      if (!line.includes('#')) {
        inCrash = false;
        return;
      }
    } else {
      if (line.includes('#')) {
        startedBacktrace = true;
      }
    }

    console.log(line);
  }
}

const adb = spawn('adb', ['logcat']);

adb.stdout.on('data', (data) => {
  if (data) {
    data.toString().split('\n').map(line => printLine(line));
  }
});

adb.stderr.on('data', (data) => {
  if (data) {
    data.toString().split('\n').map(line => printLine(line));
  }
});

adb.on('error', (error) => {
  console.error(`error: ${error.message}`);
});

adb.on('close', (code) => {
  console.log(`child process exited with code ${code}`);
});
