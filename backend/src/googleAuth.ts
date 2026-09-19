import { OAuth2Client } from 'google-auth-library';

// Verifies the Google ID token the Android app receives from Google Sign-In.
// Its audience is the Web client ID configured in the app (EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID).
const client = new OAuth2Client();

function allowedAudiences() {
  return (process.env.GOOGLE_WEB_CLIENT_ID ?? '').split(',').map((id) => id.trim()).filter(Boolean);
}

export function isGoogleSignInConfigured() {
  return allowedAudiences().length > 0;
}

/** Returns the verified email, or null when the token is not a valid Google ID token for this app. */
export async function verifyGoogleIdToken(idToken: string) {
  const audience = allowedAudiences();
  if (!audience.length) return null;
  try {
    const ticket = await client.verifyIdToken({ idToken, audience });
    const payload = ticket.getPayload();
    if (!payload?.email || payload.email_verified !== true) return null;
    if (payload.iss !== 'accounts.google.com' && payload.iss !== 'https://accounts.google.com') return null;
    return payload.email;
  } catch {
    return null;
  }
}
