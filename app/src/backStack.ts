import { BackHandler, Platform } from 'react-native';

type Handler = () => boolean;

// iPhones have no back button, so iOS keeps its own list of back handlers, used by the
// edge swipe (see EdgeSwipeBack). Like Android, the most recently added handler runs first.
const iosHandlers: Handler[] = [];

/** Registers a back handler: the Android back button, or the iPhone edge swipe. */
export function addBackListener(handler: Handler) {
  if (Platform.OS !== 'ios') return BackHandler.addEventListener('hardwareBackPress', handler);
  iosHandlers.push(handler);
  return {
    remove() {
      const index = iosHandlers.lastIndexOf(handler);
      if (index >= 0) iosHandlers.splice(index, 1);
    },
  };
}

/** Runs the back handlers from newest to oldest until one handles it. */
export function goBack() {
  for (let index = iosHandlers.length - 1; index >= 0; index -= 1) {
    if (iosHandlers[index]()) return true;
  }
  return false;
}
