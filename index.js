import { TurboModuleRegistry, AppRegistry } from 'react-native';

try {
  const expoCore = TurboModuleRegistry.get('ExpoModulesCore');
  if (expoCore && typeof expoCore.installModules === 'function') {
    expoCore.installModules();
  }
} catch (_e) {}

import App from './App';

AppRegistry.registerComponent('main', () => App);

