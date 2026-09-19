import { NextFunction, Request, Response } from 'express';
import { pool } from './db.js';
import { looksLikeFirebaseIdToken, verifyFirebaseIdToken } from './firebase.js';
import { hashToken } from './security.js';

export type Role = 'admin' | 'staff' | 'accountant';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  isSeedAdmin: boolean;
};

export type AuthenticatedRequest = Request & { authUser?: AuthUser };

export async function requireAuth(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  const authorization = request.header('authorization') ?? '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';

  if (!token) return response.status(401).json({ error: 'Authentication is required.' });

  if (looksLikeFirebaseIdToken(token)) {
    let firebaseToken: Awaited<ReturnType<typeof verifyFirebaseIdToken>> = null;
    try {
      firebaseToken = await verifyFirebaseIdToken(token);
    } catch {
      return response.status(401).json({ error: 'Your session is invalid or expired.' });
    }
    if (firebaseToken) {
      // Custom tokens are minted with the MediAccounts user id as the Firebase uid.
      const firebaseUser = await pool.query<AuthUser>(
        `SELECT id, email, name, role, is_seed_admin AS "isSeedAdmin"
         FROM app_users
         WHERE (id::text = $1 OR ($2 <> '' AND LOWER(email) = LOWER($2))) AND is_active = TRUE
         ORDER BY (id::text = $1) DESC
         LIMIT 1`,
        // Only trust the email claim when Google/Firebase has verified it.
        [firebaseToken.uid, firebaseToken.email_verified === true ? firebaseToken.email ?? '' : ''],
      );
      if (firebaseUser.rowCount) {
        request.authUser = firebaseUser.rows[0];
        return next();
      }
      return response.status(403).json({ error: 'This Firebase account does not have access to MediAccounts.' });
    }
  }

  const result = await pool.query<AuthUser>(
    `SELECT u.id, u.email, u.name, u.role, u.is_seed_admin AS "isSeedAdmin"
     FROM sessions s JOIN app_users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > NOW() AND u.is_active = TRUE`,
    [hashToken(token)],
  );

  if (!result.rowCount) return response.status(401).json({ error: 'Your session is invalid or expired.' });
  request.authUser = result.rows[0];
  return next();
}

export function requireAdmin(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  if (!request.authUser || request.authUser.role !== 'admin') {
    return response.status(403).json({ error: 'Administrator access is required.' });
  }
  return next();
}

export async function accessibleBusinesses(userId: string) {
  const result = await pool.query(
    `SELECT b.id, b.name, b.slug, b.logo_updated_at AS "logoUpdatedAt"
     FROM businesses b JOIN user_business_access uba ON uba.business_id = b.id
     WHERE uba.user_id = $1 AND b.is_active = TRUE ORDER BY b.name`,
    [userId],
  );
  return result.rows;
}
