import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithCredential, signInWithCustomToken, signOut, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseConfigured = Object.values(firebaseConfig).every(Boolean);

let auth: Auth | null = null;
if (firebaseConfigured) {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
}

// Firebase sign-in is best effort: the MediAccounts session token still
// authenticates API calls when Firebase is unavailable or not set up.
export async function signInWithFirebaseToken(customToken: string) {
  if (!auth) return false;
  try {
    await signInWithCustomToken(auth, customToken);
    return true;
  } catch (error) {
    console.warn('Firebase sign-in failed; continuing with the MediAccounts session.', error);
    return false;
  }
}

// Exchanges the Google account's ID token for a Firebase session and returns the
// Firebase ID token the backend verifies in POST /auth/google.
export async function firebaseIdTokenFromGoogle(googleIdToken: string) {
  if (!auth) throw new Error('Firebase is not configured in this app.');
  const credential = await signInWithCredential(auth, GoogleAuthProvider.credential(googleIdToken));
  return credential.user.getIdToken();
}

export async function signOutFirebase() {
  if (auth) await signOut(auth);
}
