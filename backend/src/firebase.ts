import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { existsSync, readFileSync } from 'node:fs';

function firebaseCredentials() {
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n').trim();
  if (!projectId || !clientEmail || !privateKey) return null;
  return { projectId, clientEmail, privateKey };
}

function firebaseCredential() {
  const credentials = firebaseCredentials();
  if (credentials) return cert(credentials);
  const credentialPath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  if (credentialPath && existsSync(credentialPath)) {
    return cert(JSON.parse(readFileSync(credentialPath, 'utf8')));
  }
  return applicationDefault();
}

export function isFirebaseConfigured() {
  return firebaseCredentials() !== null || Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim());
}

function firebaseAuth(): Auth | null {
  if (!isFirebaseConfigured()) return null;
  const app = getApps()[0] ?? initializeApp({ credential: firebaseCredential() });
  return getAuth(app);
}

// Firebase is an extra sign-in layer on top of the OTP session. If it is
// misconfigured or unreachable, sign-in must still succeed with the session token.
export async function createFirebaseCustomToken(userId: string, email: string) {
  try {
    const auth = firebaseAuth();
    if (!auth) return null;
    return await auth.createCustomToken(userId, { email });
  } catch (error) {
    console.warn('[MediAccounts Firebase] Unable to create a custom token:', error instanceof Error ? error.message : error);
    return null;
  }
}

// Session tokens are random hex strings; only JWT-shaped bearers can be Firebase ID tokens.
export function looksLikeFirebaseIdToken(token: string) {
  return token.split('.').length === 3;
}

export async function verifyFirebaseIdToken(token: string) {
  const auth = firebaseAuth();
  if (!auth) return null;
  return auth.verifyIdToken(token);
}
