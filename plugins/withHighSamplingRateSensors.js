// Lets expo-sensors sample the accelerometer at the requested rate on Android 12+
// (otherwise Android caps it at ~5 Hz, which misses quick shake peaks).
// A normal install-time permission: no prompt is shown to the user.
const { AndroidConfig } = require('expo/config-plugins');

module.exports = function withHighSamplingRateSensors(config) {
  return AndroidConfig.Permissions.withPermissions(config, ['android.permission.HIGH_SAMPLING_RATE_SENSORS']);
};
