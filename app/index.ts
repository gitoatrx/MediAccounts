import { registerRootComponent } from 'expo';
import { createElement } from 'react';

import App from './App';
import { ScaledRoot } from './src/ScaledRoot';

function Root() {
  return createElement(ScaledRoot, null, createElement(App));
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => Root);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(Root);
