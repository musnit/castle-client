/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

import AppPerfTest from './js/AppPerfTest';

AppRegistry.registerComponent(appName, () => AppPerfTest);
