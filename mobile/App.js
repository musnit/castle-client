// https://github.com/parshap/node-libs-react-native/tree/13cae5d884eb9e93bb0b92b3d18631791fb7d4d3#globals
require('node-libs-react-native/globals');

import Main from './js/Main';

import * as Sentry from '@sentry/react-native';

Sentry.init({ 
  dsn: 'https://0215bab0a1264d8db40e95388137688e@o406807.ingest.sentry.io/5275015', 
});


export default Main;
