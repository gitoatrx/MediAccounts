import { Platform } from 'react-native';
import { GoogleSignin, isErrorWithCode, isSuccessResponse, statusCodes } from '@react-native-google-signin/google-signin';

// The Web client ID (client_type 3) from Firebase -> Authentication -> Google.
// Google returns ID tokens for this audience, which Firebase then accepts.
const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim();
// iOS also needs its own client ID (CLIENT_ID in GoogleService-Info.plist); app.config.js registers its URL scheme.
const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim();

let configured = false;
function ensureConfigured() {
  if (!webClientId) throw new Error('Google sign-in is not set up in this app yet.');
  // Without an iOS client ID the native SDK crashes the app instead of returning an error.
  if (Platform.OS === 'ios' && !iosClientId) throw new Error('Google sign-in is not set up for iPhone yet.');
  if (!configured) {
    GoogleSignin.configure({ webClientId, iosClientId });
    configured = true;
  }
}

/** Opens the Google account chooser. Resolves to null when the user cancels. */
export async function getGoogleIdToken() {
  ensureConfigured();
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  // Clear the previous Google choice so the account chooser always appears.
  await GoogleSignin.signOut().catch(() => undefined);
  const response = await GoogleSignin.signIn();
  if (!isSuccessResponse(response)) return null;
  if (!response.data.idToken) throw new Error('Google did not return a sign-in token. Try again.');
  return response.data.idToken;
}

export async function signOutGoogle() {
  if (!webClientId || (Platform.OS === 'ios' && !iosClientId)) return;
  ensureConfigured();
  await GoogleSignin.signOut().catch(() => undefined);
}

export function googleSignInErrorMessage(error: unknown) {
  if (isErrorWithCode(error)) {
    if (error.code === statusCodes.IN_PROGRESS) return 'Google sign-in is already in progress.';
    if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) return 'Update Google Play services on this phone, then try again.';
    // DEVELOPER_ERROR: the package name or SHA-1 is not registered for this web client ID.
    if (String(error.code) === '10' || error.code === 'DEVELOPER_ERROR') return 'Google sign-in is not configured for this app build yet.';
  }
  const code = typeof error === 'object' && error && 'code' in error ? String((error as { code: unknown }).code) : '';
  if (code === 'auth/configuration-not-found' || code === 'auth/operation-not-allowed') return 'Google sign-in is not enabled in Firebase yet.';
  if (code === 'auth/network-request-failed') return 'Check your internet connection and try again.';
  if (/network request failed|failed to fetch/i.test(error instanceof Error ? error.message : '')) return "Can't reach the MediAccounts server. Check your connection and try again.";
  if (isErrorWithCode(error) && String(error.code) === '7') return 'Google could not be reached. Check your internet connection and try again.';
  const base = error instanceof Error && error.message ? error.message : 'Unable to sign in with Google.';
  // Include the code so problems can be diagnosed from a screenshot.
  return code && !base.includes(code) ? `${base} (${code})` : base;
}
