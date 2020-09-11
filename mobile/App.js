// https://github.com/parshap/node-libs-react-native/tree/13cae5d884eb9e93bb0b92b3d18631791fb7d4d3#globals
require('node-libs-react-native/globals');

import Main from './js/Main';
import { AMPLITUDE_KEY, SENTRY_DSN } from '@env';

import * as Sentry from '@sentry/react-native';
import * as Amplitude from 'expo-analytics-amplitude';

Sentry.init({
  dsn: SENTRY_DSN,
  environment: __DEV__ ? 'debug' : 'release',
});

if (AMPLITUDE_KEY) {
  Amplitude.initialize(AMPLITUDE_KEY);
}

export default Main;
