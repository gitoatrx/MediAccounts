// Extends app.json. Google sign-in on iOS needs the reversed iOS client ID registered as a URL scheme,
// so Google can hand control back to the app after the account chooser.
module.exports = ({ config }) => {
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim();
  if (!iosClientId) return config;
  const scheme = iosClientId.split('.').reverse().join('.');
  const infoPlist = config.ios?.infoPlist ?? {};
  const urlTypes = infoPlist.CFBundleURLTypes ?? [];
  return {
    ...config,
    ios: {
      ...config.ios,
      infoPlist: { ...infoPlist, CFBundleURLTypes: [...urlTypes, { CFBundleURLSchemes: [scheme] }] },
    },
  };
};
