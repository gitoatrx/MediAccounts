import cors from 'cors';
import dotenv from 'dotenv';
import express, { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { mkdirSync, readFileSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { parse } from 'csv-parse/sync';
import { accessibleBusinesses, AuthenticatedRequest, requireAdmin, requireAuth, Role } from './access.js';
import { pool } from './db.js';
import { canReadBill, isBillReadingConfigured, matchBillsForImport, processBill, startBillWorker } from './bills.js';
import { categorizeTransactions, isAiCategorizationConfigured, keywordCategory, STANDARD_CATEGORIES } from './categorize.js';
import { emailMode, isEmailDeliveryConfigured, sendLoginCodeEmail, verifyEmailDelivery } from './email.js';
import { addressDetails, autocompleteAddress, PlacesError } from './places.js';
import { isGoogleSignInConfigured, verifyGoogleIdToken } from './googleAuth.js';
import { createFirebaseCustomToken, isFirebaseConfigured, verifyFirebaseIdToken } from './firebase.js';
import { createOtp, decryptSecret, encryptSecret, hashOtp, hashToken, normalizeEmail, randomToken } from './security.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 4000);
const codeLifetimeMinutes = 10;
const resendCooldownSeconds = 30;
const maxCodeAttempts = 5;
const sessionLifetimeHours = 12;

app.use(cors({ origin: process.env.CLIENT_ORIGIN?.split(',') ?? true }));
app.use(express.json());
const uploadDirectory = path.resolve(process.cwd(), 'uploads');
mkdirSync(uploadDirectory, { recursive: true });
const billStorage = multer.diskStorage({ destination: uploadDirectory, filename: (_request, file, callback) => callback(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname)}`) });
const imageOnly = (types: string[]) => (_request: unknown, file: Express.Multer.File, callback: multer.FileFilterCallback) => {
  if (types.includes(file.mimetype.toLowerCase())) return callback(null, true);
  return callback(new UploadRejected('Bills must be JPG or PNG images.'));
};
class UploadRejected extends Error {}
// OATRx finance/bills: image, jpeg/jpg/png, max 6 MB.
const standaloneBillUpload = multer({ storage: billStorage, limits: { fileSize: 6 * 1024 * 1024 }, fileFilter: imageOnly(['image/jpeg', 'image/jpg', 'image/png']) });
// OATRx bills/attach-to-transaction: image, jpeg/jpg/png/gif, max 10 MB.
const billUpload = multer({ storage: billStorage, limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: imageOnly(['image/jpeg', 'image/jpg', 'image/png', 'image/gif']) });
/** Runs a multer upload and turns its errors (wrong type, too large) into a 400 reply. */
function acceptUpload(upload: ReturnType<ReturnType<typeof multer>['single']>, tooLarge: string) {
  return (request: Request, response: Response, next: NextFunction) => upload(request, response, (error: unknown) => {
    if (!error) return next();
    if (error instanceof UploadRejected) return response.status(400).json({ error: error.message });
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') return response.status(400).json({ error: tooLarge });
    return next(error);
  });
}
// Business logos and profile photos: images only, up to 6 MB.
const imageUpload = multer({ storage: multer.diskStorage({ destination: uploadDirectory, filename: (_request, file, callback) => callback(null, `image-${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname) || '.jpg'}`) }), limits: { fileSize: 6 * 1024 * 1024 }, fileFilter: (_request, file, callback) => callback(null, file.mimetype.startsWith('image/')) });
const csvUpload = multer({ storage: multer.diskStorage({ destination: uploadDirectory, filename: (_request, file, callback) => callback(null, `${Date.now()}-${Math.random().toString(36).slice(2)}.csv`) }), limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (_request, file, callback) => callback(null, file.mimetype === 'text/csv' || file.originalname.toLowerCase().endsWith('.csv')) });

function asyncRoute(handler: (request: any, response: Response, next: NextFunction) => Promise<unknown>) {
  return (request: Request, response: Response, next: NextFunction) => {
    void handler(request, response, next).catch(next);
  };
}

function userResponse(user: { id: string; email: string; name: string; role: Role; is_seed_admin?: boolean; isSeedAdmin?: boolean }) {
  return { id: user.id, email: user.email, name: user.name, role: user.role, isSeedAdmin: user.isSeedAdmin ?? user.is_seed_admin ?? false };
}

const CARD_ACCOUNT_TYPES = ['Credit Card', 'Debit Card'];
const CARD_TYPES = ['Visa', 'Master Card'];

// Card type only applies to credit/debit cards. Returns undefined when the value is invalid.
function cardTypeFor(accountType: string, value: unknown): string | null | undefined {
  if (!CARD_ACCOUNT_TYPES.includes(accountType)) return null;
  if (value === undefined || value === null || value === '') return null;
  return typeof value === 'string' && CARD_TYPES.includes(value.trim()) ? value.trim() : undefined;
}

function businessSlug(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function parseImportedDate(value: string) {
  const raw = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const compactParts = raw.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (compactParts) {
    const year = Number(compactParts[1]);
    const month = Number(compactParts[2]);
    const day = Number(compactParts[3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? raw.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3') : '';
  }

  const numericParts = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (numericParts) {
    const month = Number(numericParts[1]);
    const day = Number(numericParts[2]);
    const year = Number(numericParts[3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
    return '';
  }

  // Canadian bank exports often use values such as "Sep 2, 2026".
  const namedParts = raw.match(/^([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(\d{4})$/);
  if (!namedParts) return '';
  const parsed = new Date(`${namedParts[1]} ${namedParts[2]}, ${namedParts[3]} UTC`);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10);
}

function parseImportedAmount(value: string) {
  const normalized = value.trim().replace(/[$,\s]/g, '').replace(/^\((.+)\)$/, '-$1');
  if (!normalized) return null;
  const amount = Number(normalized.replace(/(CR|DR)$/i, ''));
  if (!Number.isFinite(amount)) return null;
  return /DR$/i.test(normalized) ? -Math.abs(amount) : amount;
}

function firstCsvValue(row: Record<string, string>, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === 'string' && value.trim()) return value;
  }
  return '';
}

function suggestedCategory(...values: string[]) {
  return keywordCategory(values.join(' '));
}

async function categorizeUncategorizedTransactions(businessId: string) {
  const result = await pool.query<{ id: string; merchant: string; description: string }>("SELECT id, merchant, description FROM transactions WHERE business_id = $1 AND category IN ('Uncategorized', '')", [businessId]);
  for (const transaction of result.rows) {
    const category = suggestedCategory(transaction.merchant, transaction.description);
    // Leave rows the keywords can't place alone so they aren't rewritten on every load.
    if (category !== 'Uncategorized') await pool.query('UPDATE transactions SET category = $2, updated_at = NOW() WHERE id = $1', [transaction.id, category]);
  }
}

async function selectedBusiness(userId: string, requestedId?: unknown) {
  const businesses = await accessibleBusinesses(userId);
  if (!businesses.length) return { businesses, business: null };
  const business = typeof requestedId === 'string'
    ? businesses.find((item) => item.id === requestedId) ?? null
    : businesses.find((item) => item.slug === 'westside-retail') ?? businesses[0];
  return { businesses, business };
}

async function financeWorkspace(userId: string, requestedBusinessId?: unknown) {
  const { businesses, business } = await selectedBusiness(userId, requestedBusinessId);
  if (!business) return { businesses, activeBusiness: null, bankAccounts: [], transactions: [], dashboard: null, charts: { categories: [], months: [] }, report: null };

  await categorizeUncategorizedTransactions(business.id);

  const [bankAccounts, transactions, totals, categories, months] = await Promise.all([
    pool.query(`SELECT id, name, masked_number AS "maskedNumber", account_type AS "accountType", card_type AS "cardType", is_primary AS "isPrimary", balance FROM bank_accounts WHERE business_id = $1 AND is_active = TRUE ORDER BY created_at`, [business.id]),
    pool.query(`SELECT t.id, t.business_id AS "businessId", t.bank_account_id AS "bankAccountId", t.posted_on AS "postedOn", TO_CHAR(t.posted_on, 'Mon FMDD') AS "postedLabel", t.merchant, t.description, t.amount, t.category, t.gst, t.pst, t.memo, t.created_at AS "createdAt", t.bill_status AS "billStatus", t.bill_name AS "billName", t.bill_size_bytes AS "billSizeBytes", t.bill_mime_type AS "billMimeType", ba.name AS "bankAccountName", ba.masked_number AS "bankAccountNumber", uploader.name AS "billUploadedBy", CASE WHEN t.bill_mapped_by = 'ai' THEN 'AI' ELSE mapper.name END AS "billMappedBy", t.bill_mapped_at AS "billMappedAt" FROM transactions t LEFT JOIN bank_accounts ba ON ba.id = t.bank_account_id LEFT JOIN app_users uploader ON uploader.id = t.bill_uploaded_by LEFT JOIN app_users mapper ON mapper.id::text = t.bill_mapped_by WHERE t.business_id = $1 ORDER BY t.posted_on DESC, t.created_at DESC`, [business.id]),
    pool.query(`SELECT COALESCE(SUM(ABS(amount)) FILTER (WHERE amount < 0), 0) AS spent, COUNT(DISTINCT category) AS "categoryCount", COUNT(*) FILTER (WHERE bill_status = 'missing') AS "billsMissing", COALESCE(SUM(gst), 0) AS "gstClaimable", COUNT(*) AS "transactionCount" FROM transactions WHERE business_id = $1`, [business.id]),
    pool.query(`SELECT category AS name, COALESCE(SUM(ABS(amount)), 0) AS amount FROM transactions WHERE business_id = $1 AND amount < 0 GROUP BY category ORDER BY amount DESC`, [business.id]),
    pool.query(`SELECT TO_CHAR(date_trunc('month', posted_on), 'Mon') AS month, COALESCE(SUM(ABS(amount)), 0) AS amount FROM transactions WHERE business_id = $1 AND amount < 0 GROUP BY date_trunc('month', posted_on) ORDER BY date_trunc('month', posted_on) DESC LIMIT 6`, [business.id]),
  ]);
  const summary = totals.rows[0];
  return {
    businesses,
    activeBusiness: business,
    bankAccounts: bankAccounts.rows,
    transactions: transactions.rows,
    dashboard: { spent: summary.spent, categoryCount: Number(summary.categoryCount), billsMissing: Number(summary.billsMissing), gstClaimable: summary.gstClaimable, transactionCount: Number(summary.transactionCount) },
    charts: { categories: categories.rows, months: months.rows.reverse() },
    report: { spent: summary.spent, gstClaimable: summary.gstClaimable, billsMissing: Number(summary.billsMissing), transactionCount: Number(summary.transactionCount) },
  };
}

async function createSession(user: { id: string; email: string; name: string; role: Role; is_seed_admin: boolean }) {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + sessionLifetimeHours * 60 * 60 * 1000);
  await pool.query('INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)', [user.id, hashToken(token), expiresAt]);
  return {
    token,
    firebaseToken: await createFirebaseCustomToken(user.id, user.email),
    expiresAt: expiresAt.toISOString(),
    user: userResponse(user),
    businesses: await accessibleBusinesses(user.id),
  };
}

app.get('/health', (_request, response) => response.json({ status: 'ok', service: 'MediAccounts backend' }));

app.post('/auth/request-code', asyncRoute(async (request, response) => {
  const email = typeof request.body?.email === 'string' ? normalizeEmail(request.body.email) : '';
  if (!email || !email.includes('@')) return response.status(400).json({ error: 'A valid email address is required.' });
  const users = await pool.query<{ id: string; email: string }>('SELECT id, email FROM app_users WHERE LOWER(email) = LOWER($1) AND is_active = TRUE', [email]);
  const user = users.rows[0];
  if (!user) return response.status(403).json({ error: 'This email does not have access to MediAccounts.' });
  if (!isEmailDeliveryConfigured()) return response.status(503).json({ error: 'Email delivery is not configured yet. Set the SMTP settings on the server.' });
  const recent = await pool.query<{ wait: number }>(
    `SELECT CEIL(EXTRACT(EPOCH FROM (created_at + make_interval(secs => $2) - NOW())))::int AS wait
     FROM login_codes WHERE user_id = $1 AND consumed_at IS NULL ORDER BY created_at DESC LIMIT 1`,
    [user.id, resendCooldownSeconds],
  );
  const wait = recent.rows[0]?.wait ?? 0;
  if (wait > 0) {
    return response.status(429).json({ error: `Please wait ${wait} seconds before requesting another code.`, retryAfterSeconds: wait });
  }
  const code = createOtp();
  await pool.query('DELETE FROM login_codes WHERE user_id = $1 AND consumed_at IS NULL', [user.id]);
  await pool.query("INSERT INTO login_codes (user_id, code_hash, expires_at) VALUES ($1, $2, NOW() + INTERVAL '10 minutes')", [user.id, hashOtp(user.email, code)]);
  try {
    await sendLoginCodeEmail(user.email, code, codeLifetimeMinutes);
  } catch (error) {
    console.error('[MediAccounts email] Unable to send sign-in code:', error instanceof Error ? error.message : error);
    await pool.query('DELETE FROM login_codes WHERE user_id = $1 AND consumed_at IS NULL', [user.id]);
    return response.status(502).json({ error: 'We could not send the sign-in email. Try again in a moment.' });
  }
  // Local testing only: without SMTP the code is returned so the app can display it.
  // Once SMTP is configured (or NODE_ENV=production) codes are only delivered by email.
  const devCode = emailMode() === 'log' && process.env.NODE_ENV !== 'production' ? code : undefined;
  return response.json({ message: `A sign-in code was sent to ${user.email}.`, email: user.email, expiresInMinutes: codeLifetimeMinutes, resendAfterSeconds: resendCooldownSeconds, devCode });
}));

app.post('/auth/verify-code', asyncRoute(async (request, response) => {
  const email = typeof request.body?.email === 'string' ? normalizeEmail(request.body.email) : '';
  const code = typeof request.body?.code === 'string' ? request.body.code.trim() : '';
  if (!email || !/^\d{6}$/.test(code)) return response.status(400).json({ error: 'Enter your email and six-digit code.' });
  const records = await pool.query<{ id: string; email: string; name: string; role: Role; is_seed_admin: boolean; code_id: string; code_hash: string; failed_attempts: number }>(`SELECT u.id, u.email, u.name, u.role, u.is_seed_admin, lc.id AS code_id, lc.code_hash, lc.failed_attempts FROM app_users u JOIN login_codes lc ON lc.user_id = u.id WHERE LOWER(u.email) = LOWER($1) AND u.is_active = TRUE AND lc.consumed_at IS NULL AND lc.expires_at > NOW() ORDER BY lc.created_at DESC LIMIT 1`, [email]);
  const record = records.rows[0];
  if (!record) return response.status(401).json({ error: 'That code has expired. Tap Resend code to get a new one.' });
  if (record.code_hash !== hashOtp(email, code)) {
    const attempts = record.failed_attempts + 1;
    if (attempts >= maxCodeAttempts) {
      await pool.query('UPDATE login_codes SET failed_attempts = $2, consumed_at = NOW() WHERE id = $1', [record.code_id, attempts]);
      return response.status(401).json({ error: 'Too many incorrect attempts. Tap Resend code to get a new one.' });
    }
    await pool.query('UPDATE login_codes SET failed_attempts = $2 WHERE id = $1', [record.code_id, attempts]);
    const left = maxCodeAttempts - attempts;
    return response.status(401).json({ error: `That code is incorrect. ${left} ${left === 1 ? 'attempt' : 'attempts'} left.` });
  }
  await pool.query('UPDATE login_codes SET consumed_at = NOW() WHERE user_id = $1 AND consumed_at IS NULL', [record.id]);
  return response.json(await createSession(record));
}));

app.post('/auth/google', asyncRoute(async (request, response) => {
  const idToken = typeof request.body?.idToken === 'string' ? request.body.idToken.trim() : '';
  if (!idToken) return response.status(400).json({ error: 'A Google sign-in token is required.' });
  if (!isGoogleSignInConfigured() && !isFirebaseConfigured()) return response.status(503).json({ error: 'Google sign-in is not configured on the server.' });
  // Preferred: the Google ID token straight from the app. Also accepts a Firebase ID token
  // from Google sign-in, so older app builds keep working.
  let email = await verifyGoogleIdToken(idToken);
  if (!email && isFirebaseConfigured()) {
    try {
      const decoded = await verifyFirebaseIdToken(idToken);
      if (decoded?.firebase?.sign_in_provider === 'google.com' && decoded.email_verified === true && decoded.email) email = decoded.email;
    } catch { /* not a Firebase token */ }
  }
  if (!email) return response.status(401).json({ error: 'Google sign-in could not be verified. Try again.' });
  const normalized = normalizeEmail(email);
  const users = await pool.query<{ id: string; email: string; name: string; role: Role; is_seed_admin: boolean }>('SELECT id, email, name, role, is_seed_admin FROM app_users WHERE LOWER(email) = LOWER($1) AND is_active = TRUE', [normalized]);
  const user = users.rows[0];
  if (!user) return response.status(403).json({ error: `${normalized} does not have access to MediAccounts. Ask an administrator to add you.` });
  return response.json(await createSession(user));
}));

app.get('/auth/me', requireAuth, asyncRoute(async (request: AuthenticatedRequest, response) => response.json({ user: userResponse(request.authUser!), businesses: await accessibleBusinesses(request.authUser!.id) })));
app.get('/profile', requireAuth, asyncRoute(async (request: AuthenticatedRequest, response) => {
  const result = await pool.query<{ phone: string | null }>('SELECT phone FROM app_users WHERE id = $1', [request.authUser!.id]);
  return response.json({ user: userResponse(request.authUser!), phone: result.rows[0]?.phone ?? '' });
}));
app.patch('/profile', requireAuth, asyncRoute(async (request: AuthenticatedRequest, response) => {
  const name = typeof request.body?.name === 'string' ? request.body.name.trim() : undefined;
  const phone = typeof request.body?.phone === 'string' ? request.body.phone.trim() : undefined;
  if (name !== undefined && !name) return response.status(400).json({ error: 'Name cannot be empty.' });
  const result = await pool.query(`UPDATE app_users SET name = COALESCE($2, name), phone = COALESCE($3, phone), updated_at = NOW() WHERE id = $1 RETURNING id, email, name, role, is_seed_admin AS "isSeedAdmin", phone`, [request.authUser!.id, name ?? null, phone ?? null]);
  return response.json({ user: userResponse(result.rows[0]), phone: result.rows[0].phone ?? '' });
}));
app.post('/auth/logout', requireAuth, asyncRoute(async (request: AuthenticatedRequest, response) => {
  const token = (request.header('authorization') ?? '').slice(7);
  await pool.query('DELETE FROM sessions WHERE token_hash = $1', [hashToken(token)]);
  return response.status(204).end();
}));
app.get('/places/autocomplete', requireAuth, asyncRoute(async (request: AuthenticatedRequest, response) => {
  const input = typeof request.query.input === 'string' ? request.query.input.trim() : '';
  const sessionToken = typeof request.query.sessionToken === 'string' ? request.query.sessionToken : undefined;
  if (input.length < 3) return response.json({ suggestions: [] });
  try {
    return response.json({ suggestions: await autocompleteAddress(input.slice(0, 200), sessionToken) });
  } catch (error) {
    if (error instanceof PlacesError) return response.status(error.status).json({ error: error.message });
    throw error;
  }
}));
app.get('/places/:placeId', requireAuth, asyncRoute(async (request: AuthenticatedRequest, response) => {
  const sessionToken = typeof request.query.sessionToken === 'string' ? request.query.sessionToken : undefined;
  try {
    return response.json({ address: await addressDetails(String(request.params.placeId), sessionToken) });
  } catch (error) {
    if (error instanceof PlacesError) return response.status(error.status).json({ error: error.message });
    throw error;
  }
}));
app.get('/businesses', requireAuth, asyncRoute(async (request: AuthenticatedRequest, response) => response.json({ businesses: await accessibleBusinesses(request.authUser!.id) })));
app.post('/businesses', requireAuth, asyncRoute(async (request: AuthenticatedRequest, response) => {
  const name = typeof request.body?.name === 'string' ? request.body.name.trim() : '';
  const aliasName = typeof request.body?.aliasName === 'string' ? request.body.aliasName.trim() : '';
  const businessAddress = typeof request.body?.businessAddress === 'string' ? request.body.businessAddress.trim() : '';
  const addressLine2 = typeof request.body?.addressLine2 === 'string' ? request.body.addressLine2.trim() : '';
  const city = typeof request.body?.city === 'string' ? request.body.city.trim() : '';
  const province = typeof request.body?.province === 'string' ? request.body.province.trim() : '';
  const postalCode = typeof request.body?.postalCode === 'string' ? request.body.postalCode.trim() : '';
  const institutions = Array.isArray(request.body?.institutions) ? request.body.institutions : [];
  const baseSlug = businessSlug(name);
  if (!name || !businessAddress || !baseSlug || !institutions.length) return response.status(400).json({ error: 'Business name, business address, and at least one institution are required.' });
  const accounts = institutions.map((item: any) => ({ name: typeof item?.name === 'string' ? item.name.trim() : '', accountNumber: typeof item?.accountNumber === 'string' ? item.accountNumber.replace(/\s/g, '') : '', accountType: typeof item?.accountType === 'string' ? item.accountType.trim() : 'Chequing Account', isPrimary: Boolean(item?.isPrimary), cardType: item?.cardType }));
  if (accounts.some((account: any) => !account.name || !account.accountNumber)) return response.status(400).json({ error: 'Each institution needs a name and account number.' });
  for (const account of accounts) {
    account.cardType = cardTypeFor(account.accountType, account.cardType);
    if (account.cardType === undefined) return response.status(400).json({ error: 'Card type must be Visa or Master Card.' });
  }
  // Exactly one primary institution: the first one marked, otherwise the first one.
  const primaryIndex = Math.max(0, accounts.findIndex((account: any) => account.isPrimary));
  accounts.forEach((account: any, index: number) => { account.isPrimary = index === primaryIndex; });
  let slug = baseSlug;
  let suffix = 2;
  while ((await pool.query('SELECT id FROM businesses WHERE slug = $1', [slug])).rowCount) slug = `${baseSlug}-${suffix++}`;
  await pool.query('BEGIN');
  try {
    const created = await pool.query<{ id: string; name: string; slug: string }>('INSERT INTO businesses (name, slug, alias_name, business_address, address_line2, city, province, postal_code) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id, name, slug', [name, slug, aliasName || null, businessAddress, addressLine2 || null, city || null, province || null, postalCode || null]);
    const business = created.rows[0];
    await pool.query('INSERT INTO user_business_access (user_id, business_id) VALUES ($1, $2)', [request.authUser!.id, business.id]);
    for (const account of accounts) await pool.query('INSERT INTO bank_accounts (business_id, name, masked_number, account_type, balance, is_primary, card_type) VALUES ($1,$2,$3,$4,0,$5,$6)', [business.id, account.name, `**** ${account.accountNumber.slice(-4)}`, account.accountType, account.isPrimary, account.cardType]);
    await pool.query('COMMIT');
    return response.status(201).json({ business });
  } catch (error) { await pool.query('ROLLBACK'); throw error; }
}));
async function hasBusinessAccess(userId: string, businessId: string) {
  const access = await pool.query('SELECT 1 FROM user_business_access uba JOIN businesses b ON b.id = uba.business_id WHERE uba.user_id = $1 AND uba.business_id = $2 AND b.is_active = TRUE', [userId, businessId]);
  return Boolean(access.rowCount);
}

function optionalText(value: unknown) {
  return typeof value === 'string' ? value.trim() : undefined;
}

// Optional business logo.
app.post('/businesses/:businessId/logo', requireAuth, imageUpload.single('file'), asyncRoute(async (request: AuthenticatedRequest, response) => {
  const businessId = String(request.params.businessId);
  const file = (request as AuthenticatedRequest & { file?: Express.Multer.File }).file;
  if (!(await hasBusinessAccess(request.authUser!.id, businessId))) return response.status(403).json({ error: 'You do not have access to that business.' });
  if (!file) return response.status(400).json({ error: 'Choose an image for the logo.' });
  const saved = await pool.query('UPDATE businesses SET logo_path = $2, logo_mime = $3, logo_updated_at = NOW() WHERE id = $1 RETURNING logo_updated_at AS "logoUpdatedAt"', [businessId, file.filename, file.mimetype]);
  return response.json(saved.rows[0]);
}));

app.delete('/businesses/:businessId/logo', requireAuth, asyncRoute(async (request: AuthenticatedRequest, response) => {
  const businessId = String(request.params.businessId);
  if (!(await hasBusinessAccess(request.authUser!.id, businessId))) return response.status(403).json({ error: 'You do not have access to that business.' });
  await pool.query('UPDATE businesses SET logo_path = NULL, logo_mime = NULL, logo_updated_at = NULL WHERE id = $1', [businessId]);
  return response.json({ logoUpdatedAt: null });
}));

app.get('/businesses/:businessId/logo', requireAuth, asyncRoute(async (request: AuthenticatedRequest, response) => {
  const businessId = String(request.params.businessId);
  if (!(await hasBusinessAccess(request.authUser!.id, businessId))) return response.status(403).json({ error: 'You do not have access to that business.' });
  const found = await pool.query<{ logo_path: string | null; logo_mime: string | null }>('SELECT logo_path, logo_mime FROM businesses WHERE id = $1', [businessId]);
  const logo = found.rows[0];
  if (!logo?.logo_path) return response.status(404).json({ error: 'This business has no logo.' });
  response.type(logo.logo_mime ?? 'image/jpeg');
  return response.sendFile(path.resolve(uploadDirectory, logo.logo_path));
}));

app.get('/businesses/:businessId', requireAuth, asyncRoute(async (request: AuthenticatedRequest, response) => {
  const businessId = String(request.params.businessId);
  if (!(await hasBusinessAccess(request.authUser!.id, businessId))) return response.status(403).json({ error: 'You do not have access to that business.' });
  const result = await pool.query(`SELECT id, name, slug, COALESCE(alias_name, '') AS "aliasName", COALESCE(business_address, '') AS "businessAddress", COALESCE(address_line2, '') AS "addressLine2", COALESCE(city, '') AS city, COALESCE(province, '') AS province, COALESCE(postal_code, '') AS "postalCode", logo_updated_at AS "logoUpdatedAt" FROM businesses WHERE id = $1`, [businessId]);
  return response.json({ business: result.rows[0] });
}));

app.patch('/businesses/:businessId', requireAuth, asyncRoute(async (request: AuthenticatedRequest, response) => {
  const businessId = String(request.params.businessId);
  if (!(await hasBusinessAccess(request.authUser!.id, businessId))) return response.status(403).json({ error: 'You do not have access to that business.' });
  const name = optionalText(request.body?.name);
  const businessAddress = optionalText(request.body?.businessAddress);
  if (name !== undefined && !name) return response.status(400).json({ error: 'Business name is required.' });
  if (businessAddress !== undefined && !businessAddress) return response.status(400).json({ error: 'Business address is required.' });
  const aliasName = optionalText(request.body?.aliasName);
  const addressLine2 = optionalText(request.body?.addressLine2);
  const city = optionalText(request.body?.city);
  const province = optionalText(request.body?.province);
  const postalCode = optionalText(request.body?.postalCode);
  // COALESCE keeps fields the client did not send; an empty string clears optional fields.
  const result = await pool.query(
    `UPDATE businesses SET
       name = COALESCE($2, name),
       alias_name = CASE WHEN $3::text IS NULL THEN alias_name ELSE NULLIF($3, '') END,
       business_address = COALESCE($4, business_address),
       address_line2 = CASE WHEN $5::text IS NULL THEN address_line2 ELSE NULLIF($5, '') END,
       city = CASE WHEN $6::text IS NULL THEN city ELSE NULLIF($6, '') END,
       province = CASE WHEN $7::text IS NULL THEN province ELSE NULLIF($7, '') END,
       postal_code = CASE WHEN $8::text IS NULL THEN postal_code ELSE NULLIF($8, '') END,
       updated_at = NOW()
     WHERE id = $1
     RETURNING id, name, slug, COALESCE(alias_name, '') AS "aliasName", COALESCE(business_address, '') AS "businessAddress", COALESCE(address_line2, '') AS "addressLine2", COALESCE(city, '') AS city, COALESCE(province, '') AS province, COALESCE(postal_code, '') AS "postalCode"`,
    [businessId, name ?? null, aliasName ?? null, businessAddress ?? null, addressLine2 ?? null, city ?? null, province ?? null, postalCode ?? null],
  );
  return response.json({ business: result.rows[0] });
}));

// Removes a business from the app. Soft delete: transactions, bills and accounts keep their history.
app.delete('/businesses/:businessId', requireAuth, asyncRoute(async (request: AuthenticatedRequest, response) => {
  const businessId = String(request.params.businessId);
  if (!(await hasBusinessAccess(request.authUser!.id, businessId))) return response.status(403).json({ error: 'You do not have access to that business.' });
  await pool.query('UPDATE businesses SET is_active = FALSE, updated_at = NOW() WHERE id = $1', [businessId]);
  return response.status(204).end();
}));

app.patch('/businesses/:businessId/accounts/:accountId', requireAuth, asyncRoute(async (request: AuthenticatedRequest, response) => {
  const businessId = String(request.params.businessId);
  const accountId = String(request.params.accountId);
  if (!(await hasBusinessAccess(request.authUser!.id, businessId))) return response.status(403).json({ error: 'You do not have access to that business.' });
  const existing = await pool.query('SELECT id FROM bank_accounts WHERE id = $1 AND business_id = $2 AND is_active = TRUE', [accountId, businessId]);
  if (!existing.rowCount) return response.status(404).json({ error: 'That bank account was not found.' });
  const name = optionalText(request.body?.name);
  const accountType = optionalText(request.body?.accountType);
  const accountNumber = typeof request.body?.accountNumber === 'string' ? request.body.accountNumber.replace(/\s/g, '') : '';
  const isPrimary = typeof request.body?.isPrimary === 'boolean' ? request.body.isPrimary : undefined;
  if (name !== undefined && !name) return response.status(400).json({ error: 'Institution name is required.' });
  const current = await pool.query<{ account_type: string; card_type: string | null }>('SELECT account_type, card_type FROM bank_accounts WHERE id = $1', [accountId]);
  const nextType = accountType || current.rows[0].account_type;
  // Keep the saved card type unless the client sends one; clear it for non-card accounts.
  const cardType = cardTypeFor(nextType, request.body?.cardType === undefined ? current.rows[0].card_type : request.body.cardType);
  if (cardType === undefined) return response.status(400).json({ error: 'Card type must be Visa or Master Card.' });
  if (accountNumber && accountNumber.length < 4) return response.status(400).json({ error: 'Enter at least the last 4 digits of the account number.' });
  // Only the last four digits are ever stored.
  const maskedNumber = accountNumber ? `**** ${accountNumber.slice(-4)}` : null;
  // One client for the whole transaction; pool.query may use a different connection per call.
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (isPrimary) await client.query('UPDATE bank_accounts SET is_primary = FALSE WHERE business_id = $1 AND id <> $2', [businessId, accountId]);
    const result = await client.query(
      `UPDATE bank_accounts SET name = COALESCE($2, name), account_type = COALESCE($3, account_type), masked_number = COALESCE($4, masked_number), is_primary = COALESCE($5, is_primary), card_type = $6
       WHERE id = $1 RETURNING id, name, masked_number AS "maskedNumber", account_type AS "accountType", card_type AS "cardType", balance, is_primary AS "isPrimary"`,
      [accountId, name ?? null, accountType || null, maskedNumber, isPrimary ?? null, cardType],
    );
    await client.query('COMMIT');
    return response.json({ account: result.rows[0] });
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}));

app.delete('/businesses/:businessId/accounts/:accountId', requireAuth, asyncRoute(async (request: AuthenticatedRequest, response) => {
  const businessId = String(request.params.businessId);
  const accountId = String(request.params.accountId);
  if (!(await hasBusinessAccess(request.authUser!.id, businessId))) return response.status(403).json({ error: 'You do not have access to that business.' });
  const accounts = await pool.query<{ id: string; is_primary: boolean }>('SELECT id, is_primary FROM bank_accounts WHERE business_id = $1 AND is_active = TRUE ORDER BY created_at', [businessId]);
  const target = accounts.rows.find((account) => account.id === accountId);
  if (!target) return response.status(404).json({ error: 'That bank account was not found.' });
  if (accounts.rows.length === 1) return response.status(400).json({ error: 'A business needs at least one bank account.' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Deactivate instead of deleting so past transactions and bills keep their account.
    await client.query('UPDATE bank_accounts SET is_active = FALSE, is_primary = FALSE WHERE id = $1', [accountId]);
    if (target.is_primary) {
      const next = accounts.rows.find((account) => account.id !== accountId)!;
      await client.query('UPDATE bank_accounts SET is_primary = TRUE WHERE id = $1', [next.id]);
    }
    await client.query('COMMIT');
    return response.status(204).end();
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}));

const chequeImageUpload = multer({ storage: multer.diskStorage({ destination: uploadDirectory, filename: (_request, file, callback) => callback(null, `cheque-${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname)}`) }), limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: (_request, file, callback) => callback(null, file.mimetype.startsWith('image/')) });

type ExportRow = {
  institution_number: string | null; transit_number: string | null; account_number_encrypted: string | null; account_number_last4: string | null;
  micr_routing_number: string | null; last_cheque_number: string | null; bank_address: string | null; bank_address_line2: string | null;
  bank_city: string | null; bank_province: string | null; bank_postal_code: string | null;
  cheque_image_path: string | null; cheque_image_name: string | null; cheque_image_mime: string | null; updated_at: string | null;
};

async function loadBankExport(businessId: string, accountId: string) {
  const business = await pool.query(`SELECT id, name, COALESCE(alias_name, '') AS "aliasName", COALESCE(business_address, '') AS "businessAddress", COALESCE(address_line2, '') AS "addressLine2", COALESCE(city, '') AS city, COALESCE(province, '') AS province, COALESCE(postal_code, '') AS "postalCode" FROM businesses WHERE id = $1`, [businessId]);
  const account = await pool.query(`SELECT id, name, masked_number AS "maskedNumber", account_type AS "accountType", card_type AS "cardType", is_primary AS "isPrimary" FROM bank_accounts WHERE id = $1 AND business_id = $2 AND is_active = TRUE`, [accountId, businessId]);
  if (!business.rowCount || !account.rowCount) return null;
  const details = (await pool.query<ExportRow>('SELECT * FROM bank_export_details WHERE bank_account_id = $1', [accountId])).rows[0];
  return { business: business.rows[0], account: account.rows[0], details };
}

function exportDetailsResponse(details?: ExportRow) {
  return {
    institutionNumber: details?.institution_number ?? '',
    transitNumber: details?.transit_number ?? '',
    accountNumberLast4: details?.account_number_last4 ?? '',
    hasAccountNumber: Boolean(details?.account_number_encrypted),
    micrRoutingNumber: details?.micr_routing_number ?? '',
    lastChequeNumber: details?.last_cheque_number ?? '',
    bankAddress: details?.bank_address ?? '',
    bankAddressLine2: details?.bank_address_line2 ?? '',
    bankCity: details?.bank_city ?? '',
    bankProvince: details?.bank_province ?? '',
    bankPostalCode: details?.bank_postal_code ?? '',
    chequeImageName: details?.cheque_image_name ?? '',
    updatedAt: details?.updated_at ?? null,
  };
}

app.get('/businesses/:businessId/accounts/:accountId/export', requireAuth, requireAdmin, asyncRoute(async (request: AuthenticatedRequest, response) => {
  const businessId = String(request.params.businessId);
  const accountId = String(request.params.accountId);
  if (!(await hasBusinessAccess(request.authUser!.id, businessId))) return response.status(403).json({ error: 'You do not have access to that business.' });
  const data = await loadBankExport(businessId, accountId);
  if (!data) return response.status(404).json({ error: 'That bank account was not found.' });
  return response.json({ business: data.business, account: data.account, details: exportDetailsResponse(data.details) });
}));

app.put('/businesses/:businessId/accounts/:accountId/export', requireAuth, requireAdmin, chequeImageUpload.single('chequeImage'), asyncRoute(async (request: AuthenticatedRequest, response) => {
  const businessId = String(request.params.businessId);
  const accountId = String(request.params.accountId);
  const uploaded = request.file;
  const discardUpload = () => { if (uploaded) { try { unlinkSync(uploaded.path); } catch { /* already gone */ } } };
  if (!(await hasBusinessAccess(request.authUser!.id, businessId))) { discardUpload(); return response.status(403).json({ error: 'You do not have access to that business.' }); }
  const current = await loadBankExport(businessId, accountId);
  if (!current) { discardUpload(); return response.status(404).json({ error: 'That bank account was not found.' }); }
  const text = (key: string) => (typeof request.body?.[key] === 'string' ? request.body[key].trim() : '');
  const digits = (key: string) => text(key).replace(/[\s-]/g, '');
  const input = {
    businessName: text('businessName'), aliasName: text('aliasName'), businessAddress: text('businessAddress'), addressLine2: text('addressLine2'),
    city: text('city'), province: text('province'), postalCode: text('postalCode'),
    institutionNumber: digits('institutionNumber'), transitNumber: digits('transitNumber'), accountNumber: digits('accountNumber'),
    micrRoutingNumber: digits('micrRoutingNumber'), lastChequeNumber: digits('lastChequeNumber'),
    bankAddress: text('bankAddress'), bankAddressLine2: text('bankAddressLine2'), bankCity: text('bankCity'), bankProvince: text('bankProvince'), bankPostalCode: text('bankPostalCode'),
  };
  const problems: string[] = [];
  if (!input.businessName) problems.push('Business name is required.');
  if (!input.businessAddress) problems.push('Business address is required.');
  if (!/^\d{3}$/.test(input.institutionNumber)) problems.push('Institution number must be 3 digits.');
  if (!/^\d{5}$/.test(input.transitNumber)) problems.push('Transit number must be 5 digits.');
  if (input.accountNumber ? !/^\d{5,17}$/.test(input.accountNumber) : !current.details?.account_number_encrypted) problems.push('Account number must be 5 to 17 digits.');
  if (!/^\d{1,10}$/.test(input.lastChequeNumber)) problems.push('Last used cheque number must be digits.');
  if (input.micrRoutingNumber && !/^\d{5,12}$/.test(input.micrRoutingNumber)) problems.push('MICR routing number must be digits.');
  if (!input.bankAddress) problems.push('Bank address is required.');
  if (problems.length) { discardUpload(); return response.status(400).json({ error: problems[0], problems }); }

  const client = await pool.connect();
  const oldImage = current.details?.cheque_image_path;
  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE businesses SET name = $2, alias_name = NULLIF($3, ''), business_address = $4, address_line2 = NULLIF($5, ''), city = NULLIF($6, ''), province = NULLIF($7, ''), postal_code = NULLIF($8, ''), updated_at = NOW() WHERE id = $1`,
      [businessId, input.businessName, input.aliasName, input.businessAddress, input.addressLine2, input.city, input.province, input.postalCode],
    );
    await client.query(
      `INSERT INTO bank_export_details (bank_account_id, institution_number, transit_number, account_number_encrypted, account_number_last4, micr_routing_number, last_cheque_number,
         bank_address, bank_address_line2, bank_city, bank_province, bank_postal_code, cheque_image_path, cheque_image_name, cheque_image_mime, updated_by, updated_at)
       VALUES ($1,$2,$3,$4,$5,NULLIF($6,''),$7,$8,NULLIF($9,''),NULLIF($10,''),NULLIF($11,''),NULLIF($12,''),$13,$14,$15,$16,NOW())
       ON CONFLICT (bank_account_id) DO UPDATE SET
         institution_number = EXCLUDED.institution_number, transit_number = EXCLUDED.transit_number,
         account_number_encrypted = COALESCE(EXCLUDED.account_number_encrypted, bank_export_details.account_number_encrypted),
         account_number_last4 = COALESCE(EXCLUDED.account_number_last4, bank_export_details.account_number_last4),
         micr_routing_number = EXCLUDED.micr_routing_number, last_cheque_number = EXCLUDED.last_cheque_number,
         bank_address = EXCLUDED.bank_address, bank_address_line2 = EXCLUDED.bank_address_line2, bank_city = EXCLUDED.bank_city,
         bank_province = EXCLUDED.bank_province, bank_postal_code = EXCLUDED.bank_postal_code,
         cheque_image_path = COALESCE(EXCLUDED.cheque_image_path, bank_export_details.cheque_image_path),
         cheque_image_name = COALESCE(EXCLUDED.cheque_image_name, bank_export_details.cheque_image_name),
         cheque_image_mime = COALESCE(EXCLUDED.cheque_image_mime, bank_export_details.cheque_image_mime),
         updated_by = EXCLUDED.updated_by, updated_at = NOW()`,
      [accountId, input.institutionNumber, input.transitNumber,
       input.accountNumber ? encryptSecret(input.accountNumber) : null, input.accountNumber ? input.accountNumber.slice(-4) : null,
       input.micrRoutingNumber, input.lastChequeNumber, input.bankAddress, input.bankAddressLine2, input.bankCity, input.bankProvince, input.bankPostalCode,
       uploaded ? path.basename(uploaded.path) : null, uploaded?.originalname ?? null, uploaded?.mimetype ?? null, request.authUser!.id],
    );
    if (input.accountNumber) await client.query(`UPDATE bank_accounts SET masked_number = $2 WHERE id = $1`, [accountId, `**** ${input.accountNumber.slice(-4)}`]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    discardUpload();
    throw error;
  } finally {
    client.release();
  }
  if (uploaded && oldImage) { try { unlinkSync(path.resolve(uploadDirectory, oldImage)); } catch { /* already gone */ } }
  const saved = await loadBankExport(businessId, accountId);
  return response.json({ business: saved!.business, account: saved!.account, details: exportDetailsResponse(saved!.details) });
}));

app.get('/businesses/:businessId/accounts/:accountId/export/file', requireAuth, requireAdmin, asyncRoute(async (request: AuthenticatedRequest, response) => {
  const businessId = String(request.params.businessId);
  const accountId = String(request.params.accountId);
  if (!(await hasBusinessAccess(request.authUser!.id, businessId))) return response.status(403).json({ error: 'You do not have access to that business.' });
  const data = await loadBankExport(businessId, accountId);
  if (!data) return response.status(404).json({ error: 'That bank account was not found.' });
  const details = data.details;
  if (!details?.account_number_encrypted) return response.status(400).json({ error: 'Save the bank export details before exporting.' });
  let chequeImage: null | { fileName: string; mimeType: string; base64: string } = null;
  if (details.cheque_image_path) {
    try {
      chequeImage = { fileName: details.cheque_image_name ?? 'cheque-background', mimeType: details.cheque_image_mime ?? 'image/png', base64: readFileSync(path.resolve(uploadDirectory, details.cheque_image_path)).toString('base64') };
    } catch { chequeImage = null; }
  }
  const payload = {
    format: 'mediaccounts.bank-export',
    version: 1,
    exportedAt: new Date().toISOString(),
    business: data.business,
    bank: {
      institutionName: data.account.name,
      accountType: data.account.accountType,
      institutionNumber: details.institution_number,
      transitNumber: details.transit_number,
      accountNumber: decryptSecret(details.account_number_encrypted),
      micrRoutingNumber: details.micr_routing_number ?? '',
      lastUsedChequeNumber: details.last_cheque_number,
      address: { street: details.bank_address, line2: details.bank_address_line2 ?? '', city: details.bank_city ?? '', province: details.bank_province ?? '', postalCode: details.bank_postal_code ?? '' },
    },
    chequeImage,
  };
  const safeName = `${data.business.name}-${data.account.name}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  console.log(`[MediAccounts export] ${request.authUser!.email} exported bank details for account ${accountId}`);
  response.setHeader('Content-Disposition', `attachment; filename="${safeName}-bank-export.json"`);
  response.setHeader('Cache-Control', 'no-store');
  return response.json(payload);
}));

// Export Bank: copies a business + one bank into BookKeeper (cheque printing), matching OATRx exportToBookkeeper.
// Credit cards send the card number and card type; every other type sends the cheque/bank fields.
app.post('/businesses/:businessId/export-to-bookkeeper', requireAuth, requireAdmin, chequeImageUpload.single('bgImage'), asyncRoute(async (request: AuthenticatedRequest, response) => {
  const businessId = String(request.params.businessId);
  const uploaded = request.file;
  const discardUpload = () => { if (uploaded) { try { unlinkSync(uploaded.path); } catch { /* already gone */ } } };
  const fail = (status: number, error: string) => { discardUpload(); return response.status(status).json({ error }); };
  if (!(await hasBusinessAccess(request.authUser!.id, businessId))) return fail(403, 'You do not have access to that business.');
  const text = (key: string) => (typeof request.body?.[key] === 'string' ? request.body[key].trim() : '');
  const digits = (key: string) => text(key).replace(/[\s-]/g, '');
  const bankAccountId = text('bankAccountId') || null;
  let account: { name: string; account_type: string; card_type: string | null } | undefined;
  if (bankAccountId) {
    account = (await pool.query('SELECT name, account_type, card_type FROM bank_accounts WHERE id = $1 AND business_id = $2 AND is_active = TRUE', [bankAccountId, businessId])).rows[0];
    if (!account) return fail(404, 'That bank account was not found.');
  }
  const bankName = text('bankName') || account?.name || '';
  const accountType = account?.account_type ?? 'Chequing Account';
  const isCreditCard = accountType === 'Credit Card';
  const input = {
    name: text('businessName'), aliasName: text('aliasName'), address: text('businessAddress'), addressLine2: text('addressLine2'),
    city: text('city'), province: text('province'), postalCode: text('postalCode'),
    institutionNumber: digits('institutionNumber'), transitNumber: digits('transitNumber'), accountNumber: digits('accountNumber'),
    micrRoutingNumber: digits('micrRoutingNumber'), lastChequeNumber: digits('lastChequeNumber'),
    creditCardNumber: digits('creditCardNumber'), cardType: text('cardType'),
    bankAddress: text('bankAddress'), bankAddressLine2: text('bankAddressLine2'), bankCity: text('bankCity'), bankProvince: text('bankProvince'), bankPostalCode: text('bankPostalCode'),
  };
  if (!input.name) return fail(400, 'Business name is required.');
  if (!input.address) return fail(400, 'Business address is required.');
  if (!bankName) return fail(400, 'Select or enter a bank.');
  let accountNumberEncrypted: string | null = null;
  let accountNumberLast4: string | null = null;
  if (isCreditCard) {
    if (!/^\d{16}$/.test(input.creditCardNumber)) return fail(400, 'Credit card number must be 16 digits.');
    if (!CARD_TYPES.includes(input.cardType)) return fail(400, 'Card type must be Visa or Master Card.');
  } else {
    if (!/^\d{3}$/.test(input.institutionNumber)) return fail(400, 'Institution number must be 3 digits.');
    if (!/^\d{5}$/.test(input.transitNumber)) return fail(400, 'Transit number must be 5 digits.');
    if (!/^\d{1,10}$/.test(input.lastChequeNumber)) return fail(400, 'Last used cheque number is required.');
    if (input.micrRoutingNumber && !/^\d{5,12}$/.test(input.micrRoutingNumber)) return fail(400, 'MICR routing number must be digits.');
    if (input.accountNumber) {
      if (!/^\d{5,17}$/.test(input.accountNumber)) return fail(400, 'Account number must be 5 to 17 digits.');
      accountNumberEncrypted = encryptSecret(input.accountNumber);
      accountNumberLast4 = input.accountNumber.slice(-4);
    } else if (bankAccountId) {
      // Reuse the account number saved earlier for this bank, if any.
      const saved = (await pool.query<{ account_number_encrypted: string | null; account_number_last4: string | null }>('SELECT account_number_encrypted, account_number_last4 FROM bank_export_details WHERE bank_account_id = $1', [bankAccountId])).rows[0];
      accountNumberEncrypted = saved?.account_number_encrypted ?? null;
      accountNumberLast4 = saved?.account_number_last4 ?? null;
    }
    if (!accountNumberEncrypted) return fail(400, 'Account number is required.');
  }
  if (!input.bankAddress) return fail(400, 'Bank address is required.');
  const duplicate = await pool.query('SELECT 1 FROM bookkeeper_companies WHERE LOWER(name) = LOWER($1)', [input.name]);
  if (duplicate.rowCount) return fail(422, 'A BookKeeper company with this business name already exists.');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const created = await client.query(
      `INSERT INTO bookkeeper_companies (business_id, bank_account_id, name, alias_name, address, address_line2, city, province, postal_code, bank_name, account_type,
         institution_number, transit_number, account_number_encrypted, account_number_last4, micr_routing_number, last_cheque_number,
         credit_card_encrypted, credit_card_last4, card_type, bank_address, bank_address_line2, bank_city, bank_province, bank_postal_code,
         bg_image_path, bg_image_name, bg_image_mime, added_by, added_by_name)
       VALUES ($1,$2,$3,NULLIF($4,''),$5,NULLIF($6,''),NULLIF($7,''),NULLIF($8,''),NULLIF($9,''),$10,$11,
         NULLIF($12,''),NULLIF($13,''),$14,$15,NULLIF($16,''),NULLIF($17,''),$18,$19,$20,$21,NULLIF($22,''),NULLIF($23,''),NULLIF($24,''),NULLIF($25,''),$26,$27,$28,$29,$30)
       RETURNING id, name, bank_name AS "bankName", account_type AS "accountType", created_at AS "createdAt"`,
      [businessId, bankAccountId, input.name, input.aliasName, input.address, input.addressLine2, input.city, input.province, input.postalCode, bankName, accountType,
       isCreditCard ? '' : input.institutionNumber, isCreditCard ? '' : input.transitNumber, accountNumberEncrypted, accountNumberLast4,
       isCreditCard ? '' : input.micrRoutingNumber, isCreditCard ? '' : input.lastChequeNumber,
       isCreditCard ? encryptSecret(input.creditCardNumber) : null, isCreditCard ? input.creditCardNumber.slice(-4) : null, isCreditCard ? input.cardType : null,
       input.bankAddress, input.bankAddressLine2, input.bankCity, input.bankProvince, input.bankPostalCode,
       uploaded ? path.basename(uploaded.path) : null, uploaded?.originalname ?? null, uploaded?.mimetype ?? null, request.authUser!.id, request.authUser!.email],
    );
    // Remember the bank details on the account so the next export is prefilled.
    if (bankAccountId && !isCreditCard) {
      await client.query(
        `INSERT INTO bank_export_details (bank_account_id, institution_number, transit_number, account_number_encrypted, account_number_last4, micr_routing_number, last_cheque_number,
           bank_address, bank_address_line2, bank_city, bank_province, bank_postal_code, updated_by, updated_at)
         VALUES ($1,$2,$3,$4,$5,NULLIF($6,''),$7,$8,NULLIF($9,''),NULLIF($10,''),NULLIF($11,''),NULLIF($12,''),$13,NOW())
         ON CONFLICT (bank_account_id) DO UPDATE SET
           institution_number = EXCLUDED.institution_number, transit_number = EXCLUDED.transit_number,
           account_number_encrypted = EXCLUDED.account_number_encrypted, account_number_last4 = EXCLUDED.account_number_last4,
           micr_routing_number = EXCLUDED.micr_routing_number, last_cheque_number = EXCLUDED.last_cheque_number,
           bank_address = EXCLUDED.bank_address, bank_address_line2 = EXCLUDED.bank_address_line2, bank_city = EXCLUDED.bank_city,
           bank_province = EXCLUDED.bank_province, bank_postal_code = EXCLUDED.bank_postal_code, updated_by = EXCLUDED.updated_by, updated_at = NOW()`,
        [bankAccountId, input.institutionNumber, input.transitNumber, accountNumberEncrypted, accountNumberLast4, input.micrRoutingNumber, input.lastChequeNumber,
         input.bankAddress, input.bankAddressLine2, input.bankCity, input.bankProvince, input.bankPostalCode, request.authUser!.id],
      );
    }
    await client.query('COMMIT');
    console.log(`[MediAccounts export] ${request.authUser!.email} exported ${input.name} / ${bankName} to BookKeeper`);
    return response.status(201).json({ message: 'Business exported to BookKeeper successfully.', company: created.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    discardUpload();
    if ((error as { code?: string }).code === '23505') return response.status(422).json({ error: 'A BookKeeper company with this business name already exists.' });
    throw error;
  } finally { client.release(); }
}));

app.get('/businesses/:businessId/accounts', requireAuth, asyncRoute(async (request: AuthenticatedRequest, response) => {
  const businessId = String(request.params.businessId);
  const access = await pool.query('SELECT 1 FROM user_business_access uba JOIN businesses b ON b.id = uba.business_id WHERE uba.user_id = $1 AND uba.business_id = $2 AND b.is_active = TRUE', [request.authUser!.id, businessId]);
  if (!access.rowCount) return response.status(403).json({ error: 'You do not have access to that business.' });
  const accounts = await pool.query(`SELECT id, name, masked_number AS "maskedNumber", account_type AS "accountType", card_type AS "cardType", balance, is_primary AS "isPrimary" FROM bank_accounts WHERE business_id = $1 AND is_active = TRUE ORDER BY is_primary DESC, created_at`, [businessId]);
  return response.json({ accounts: accounts.rows });
}));
app.post('/businesses/:businessId/accounts', requireAuth, asyncRoute(async (request: AuthenticatedRequest, response) => {
  const businessId = String(request.params.businessId);
  const name = typeof request.body?.name === 'string' ? request.body.name.trim() : '';
  const accountType = typeof request.body?.accountType === 'string' && request.body.accountType.trim() ? request.body.accountType.trim() : 'Chequing Account';
  const rawNumber = typeof request.body?.accountNumber === 'string' ? request.body.accountNumber.replace(/\s/g, '') : '';
  const balance = Number(request.body?.balance ?? 0);
  const cardType = cardTypeFor(accountType, request.body?.cardType);
  if (!name || !rawNumber || !Number.isFinite(balance)) return response.status(400).json({ error: 'Account name, number, and a valid balance are required.' });
  if (cardType === undefined) return response.status(400).json({ error: 'Card type must be Visa or Master Card.' });
  const access = await pool.query('SELECT 1 FROM user_business_access WHERE user_id = $1 AND business_id = $2', [request.authUser!.id, businessId]);
  if (!access.rowCount) return response.status(403).json({ error: 'You do not have access to that business.' });
  const maskedNumber = `**** ${rawNumber.slice(-4)}`;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // The new account becomes primary when asked, or when the business has no primary account yet.
    const hasPrimary = Boolean((await client.query('SELECT 1 FROM bank_accounts WHERE business_id = $1 AND is_active = TRUE AND is_primary = TRUE', [businessId])).rowCount);
    const isPrimary = request.body?.isPrimary === true || !hasPrimary;
    if (isPrimary) await client.query('UPDATE bank_accounts SET is_primary = FALSE WHERE business_id = $1', [businessId]);
    const created = await client.query(`INSERT INTO bank_accounts (business_id, name, masked_number, account_type, balance, is_primary, card_type) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, name, masked_number AS "maskedNumber", account_type AS "accountType", card_type AS "cardType", balance, is_primary AS "isPrimary"`, [businessId, name, maskedNumber, accountType, balance, isPrimary, cardType]);
    await client.query('COMMIT');
    return response.status(201).json({ account: created.rows[0] });
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}));
app.get('/workspace', requireAuth, asyncRoute(async (request: AuthenticatedRequest, response) => {
  const workspace = await financeWorkspace(request.authUser!.id, request.query.businessId);
  if (typeof request.query.businessId === 'string' && !workspace.activeBusiness) return response.status(403).json({ error: 'You do not have access to that business.' });
  return response.json(workspace);
}));

app.post('/transactions', requireAuth, requireAdmin, asyncRoute(async (request: AuthenticatedRequest, response) => {
  const businessId = typeof request.body?.businessId === 'string' ? request.body.businessId : '';
  const bankAccountId = typeof request.body?.bankAccountId === 'string' ? request.body.bankAccountId : null;
  const merchant = typeof request.body?.merchant === 'string' ? request.body.merchant.trim() : '';
  const category = typeof request.body?.category === 'string' ? request.body.category.trim() : 'Uncategorized';
  const postedOn = typeof request.body?.postedOn === 'string' ? request.body.postedOn : '';
  const description = typeof request.body?.description === 'string' ? request.body.description.trim() : '';
  const memo = typeof request.body?.memo === 'string' ? request.body.memo.trim() : '';
  const amount = Number(request.body?.amount);
  const gst = Number(request.body?.gst ?? 0);
  const pst = Number(request.body?.pst ?? 0);
  if (!businessId || !merchant || !/^\d{4}-\d{2}-\d{2}$/.test(postedOn) || !Number.isFinite(amount) || !Number.isFinite(gst) || !Number.isFinite(pst)) return response.status(400).json({ error: 'Business, merchant, date, amount, GST, and PST must be valid.' });
  const access = await pool.query('SELECT 1 FROM user_business_access WHERE user_id = $1 AND business_id = $2', [request.authUser!.id, businessId]);
  if (!access.rowCount) return response.status(403).json({ error: 'You do not have access to that business.' });
  if (bankAccountId && !(await pool.query('SELECT 1 FROM bank_accounts WHERE id = $1 AND business_id = $2 AND is_active = TRUE', [bankAccountId, businessId])).rowCount) return response.status(400).json({ error: 'Choose a bank account from this business.' });
  const created = await pool.query(`INSERT INTO transactions (business_id, bank_account_id, posted_on, merchant, description, amount, category, gst, pst, memo) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`, [businessId, bankAccountId, postedOn, merchant, description, amount, category, gst, pst, memo]);
  return response.status(201).json({ transaction: { id: created.rows[0].id } });
}));

app.post('/transactions/import-csv', requireAuth, csvUpload.single('file'), asyncRoute(async (request: AuthenticatedRequest, response) => {
  const file = (request as AuthenticatedRequest & { file?: Express.Multer.File }).file;
  const businessId = typeof request.body?.businessId === 'string' ? request.body.businessId : '';
  const bankAccountId = typeof request.body?.bankAccountId === 'string' && request.body.bankAccountId ? request.body.bankAccountId : null;
  const discard = () => { if (file) { try { unlinkSync(file.path); } catch { /* already gone */ } } };
  if (!file || !businessId) { discard(); return response.status(400).json({ error: 'Choose a CSV file and business.' }); }
  if (!(await hasBusinessAccess(request.authUser!.id, businessId))) { discard(); return response.status(403).json({ error: 'You do not have access to that business.' }); }
  if (bankAccountId && !(await pool.query('SELECT 1 FROM bank_accounts WHERE id = $1 AND business_id = $2 AND is_active = TRUE', [bankAccountId, businessId])).rowCount) { discard(); return response.status(400).json({ error: 'Choose a bank account from this business.' }); }
  let rows: Array<Record<string, string>>;
  let hasHeaders = false;
  try {
    const records = parse(readFileSync(file.path, 'utf8'), { columns: false, skip_empty_lines: true, trim: true, bom: true, relax_column_count: true }) as string[][];
    const headers = records[0]?.map((value) => value.toLowerCase().replace(/[^a-z0-9]/g, '')) ?? [];
    hasHeaders = headers.some((header) => ['date', 'postedon', 'postingdate', 'transactiondate', 'transdate', 'amount', 'debit', 'credit', 'withdrawal', 'deposit', 'description', 'merchant'].includes(header));
    rows = hasHeaders
      ? records.slice(1).map((record) => Object.fromEntries(headers.map((header, index) => [header, record[index] ?? ''])))
      // CIBC's standard download has no header row: transaction date, merchant, debit, credit, account.
      : records.map((record) => ({ transactiondate: record[0] ?? '', merchant: record[1] ?? '', debit: record[2] ?? '', credit: record[3] ?? '' }));
  } catch { discard(); return response.status(400).json({ error: 'The selected file is not a valid CSV.' }); }
  discard();

  // 1. Parse every row first so categorization and duplicate checks can run in bulk.
  type Parsed = { rowNumber: number; postedOn: string; merchant: string; description: string; amount: number; gst: number; pst: number; memo: string; dedupeKey: string };
  const parsed: Parsed[] = [];
  const skippedRows: number[] = [];
  // Spreadsheet row numbers for the messages (row 1 is the header when there is one).
  const offset = hasHeaders ? 2 : 1;
  rows.forEach((rawRow, index) => {
    const row = Object.fromEntries(Object.entries(rawRow).map(([key, value]) => [key.toLowerCase().replace(/[^a-z0-9]/g, ''), value]));
    const postedOn = parseImportedDate(firstCsvValue(row, ['date', 'postedon', 'postingdate', 'transactiondate', 'transdate']));
    const merchant = firstCsvValue(row, ['merchant', 'description', 'transactiondescription', 'details', 'payee', 'name', 'memo']).trim();
    const directAmount = parseImportedAmount(firstCsvValue(row, ['amount', 'transactionamount', 'cadamount', 'amountcad']));
    const withdrawal = parseImportedAmount(firstCsvValue(row, ['withdrawal', 'withdrawals', 'debit', 'debits', 'debitamount', 'moneyout', 'charge']));
    const deposit = parseImportedAmount(firstCsvValue(row, ['deposit', 'deposits', 'credit', 'credits', 'creditamount', 'moneyin']));
    const amount = directAmount ?? (withdrawal !== null ? -Math.abs(withdrawal) : deposit !== null ? Math.abs(deposit) : null);
    if (!postedOn || !merchant || amount === null || amount === 0) { skippedRows.push(index + offset); return; }
    const description = firstCsvValue(row, ['description', 'transactiondescription', 'details', 'memo']) || merchant;
    parsed.push({
      rowNumber: index + offset, postedOn, merchant, description, amount,
      gst: Number(row.gst ?? 0) || 0, pst: Number(row.pst ?? 0) || 0, memo: row.memo ?? '',
      dedupeKey: `${postedOn}|${amount.toFixed(2)}|${merchant.toLowerCase().replace(/\s+/g, ' ')}`,
    });
  });
  if (!parsed.length) return response.status(400).json({ error: 'No valid transactions found in this CSV. Each row needs a date, description and amount.', skippedRows, totalRows: rows.length });

  // 2. Duplicates: a row is new only if the file has more copies of it than are already saved,
  //    so re-uploading a statement adds nothing while genuine same-day repeats are kept.
  const dates = parsed.map((row) => row.postedOn).sort();
  const existing = await pool.query<{ key: string; count: string }>(
    `SELECT to_char(posted_on, 'YYYY-MM-DD') || '|' || to_char(amount, 'FM999999999990.00') || '|' || lower(regexp_replace(merchant, '\\s+', ' ', 'g')) AS key, COUNT(*) AS count
     FROM transactions WHERE business_id = $1 AND bank_account_id IS NOT DISTINCT FROM $2 AND posted_on BETWEEN $3 AND $4 GROUP BY 1`,
    [businessId, bankAccountId, dates[0], dates[dates.length - 1]],
  );
  const alreadySaved = new Map(existing.rows.map((row) => [row.key, Number(row.count)]));
  const seen = new Map<string, number>();
  const fresh = parsed.filter((row) => {
    const count = (seen.get(row.dedupeKey) ?? 0) + 1;
    seen.set(row.dedupeKey, count);
    return count > (alreadySaved.get(row.dedupeKey) ?? 0);
  });
  const duplicates = parsed.length - fresh.length;

  // 3. Categorize (fixed rules → learned rules → Azure OpenAI → keywords) before opening the DB transaction.
  const { results, aiConfigured, aiError } = await categorizeTransactions(businessId, fresh.map((row) => ({ text: row.description === row.merchant ? row.merchant : `${row.merchant} ${row.description}`, amount: row.amount })));
  const bySource: Record<string, number> = {};
  results.forEach((result) => { bySource[result.source] = (bySource[result.source] ?? 0) + 1; });

  // 4. Save everything in one transaction.
  const client = await pool.connect();
  const inserted: Array<{ id: string; postedOn: string; amount: number }> = [];
  try {
    await client.query('BEGIN');
    for (let start = 0; start < fresh.length; start += 200) {
      const chunk = fresh.slice(start, start + 200);
      const values: unknown[] = [];
      const placeholders = chunk.map((row, position) => {
        const result = results[start + position];
        const base = values.length;
        values.push(businessId, bankAccountId, row.postedOn, row.merchant, row.description, row.amount, result.category, row.gst, row.pst, row.memo, start + position);
        // One import shares the same second (so Home can show it as the latest batch) and
        // steps by a microsecond per row so "first matching row" follows the file order.
        return `(${Array.from({ length: 10 }, (_, column) => `$${base + column + 1}`).join(',')}, date_trunc('second', NOW()) + ($${base + 11}::int * INTERVAL '1 microsecond'))`;
      });
      const saved = await client.query<{ id: string }>(`INSERT INTO transactions (business_id, bank_account_id, posted_on, merchant, description, amount, category, gst, pst, memo, created_at) VALUES ${placeholders.join(',')} RETURNING id`, values);
      saved.rows.forEach((row, position) => inserted.push({ id: row.id, postedOn: chunk[position].postedOn, amount: chunk[position].amount }));
    }
    await client.query('COMMIT');
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }

  // OATRx: each new row takes the first read, unmatched bill of this bank with the same date and amount.
  // Bills still being read attach themselves when their reading finishes; the rest wait for the nightly run.
  const matchedBills = await matchBillsForImport(bankAccountId, inserted).catch(() => 0);
  console.log(`[MediAccounts import] ${request.authUser!.email}: ${fresh.length} imported, ${duplicates} duplicates, ${skippedRows.length} invalid, ${matchedBills} bills matched`, bySource);
  return response.status(201).json({
    imported: fresh.length,
    duplicates,
    skippedRows,
    totalRows: rows.length,
    categorized: {
      fromFile: bySource.csv ?? 0,
      fixedRules: bySource.fixed ?? 0,
      learnedRules: (bySource.rule ?? 0) + (bySource['user-rule'] ?? 0),
      ai: bySource.ai ?? 0,
      keywords: bySource.keyword ?? 0,
    },
    ai: { configured: aiConfigured, failed: Boolean(aiError) },
    matchedBills,
  });
}));

app.post('/bills', requireAuth, acceptUpload(standaloneBillUpload.single('file'), 'Bills can be up to 6 MB.'), asyncRoute(async (request: AuthenticatedRequest, response) => {
  const file = (request as AuthenticatedRequest & { file?: Express.Multer.File }).file;
  const businessId = typeof request.body?.businessId === 'string' ? request.body.businessId : '';
  const bankAccountId = typeof request.body?.bankAccountId === 'string' ? request.body.bankAccountId : null;
  if (!file || !businessId) return response.status(400).json({ error: 'Choose a bill file and business.' });
  const access = await pool.query('SELECT 1 FROM user_business_access WHERE user_id = $1 AND business_id = $2', [request.authUser!.id, businessId]);
  if (!access.rowCount) return response.status(403).json({ error: 'You do not have access to that business.' });
  // Like OATRx, every bill belongs to a bank account of the business.
  if (!bankAccountId) return response.status(400).json({ error: 'Select the bank account for this bill.' });
  if (!(await pool.query('SELECT 1 FROM bank_accounts WHERE id = $1 AND business_id = $2 AND is_active = TRUE', [bankAccountId, businessId])).rowCount) return response.status(400).json({ error: 'Choose a bank account from this business.' });
  const readable = canReadBill(file.mimetype);
  const created = await pool.query(`INSERT INTO uploaded_bills (business_id, bank_account_id, file_name, file_size_bytes, file_path, mime_type, uploaded_by, ai_status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id, file_name AS "fileName", file_size_bytes AS "fileSizeBytes", created_at AS "createdAt"`, [businessId, bankAccountId, file.originalname, file.size, file.filename, file.mimetype, request.authUser!.id, readable ? 'pending' : 'unsupported']);
  const aiReading = readable && isBillReadingConfigured();
  // The reply does not wait for AI; the bill is read and matched in the background.
  if (aiReading) void processBill(created.rows[0].id, uploadDirectory);
  return response.status(201).json({ bill: created.rows[0], aiReading });
}));

app.get('/bills', requireAuth, asyncRoute(async (request: AuthenticatedRequest, response) => {
  const businessId = typeof request.query.businessId === 'string' ? request.query.businessId : '';
  const bankAccountId = typeof request.query.bankAccountId === 'string' ? request.query.bankAccountId : null;
  if (!businessId) return response.status(400).json({ error: 'Choose a business.' });
  const access = await pool.query('SELECT 1 FROM user_business_access WHERE user_id = $1 AND business_id = $2', [request.authUser!.id, businessId]);
  if (!access.rowCount) return response.status(403).json({ error: 'You do not have access to that business.' });
  // all=1 (bill gallery) also returns bills already attached to a transaction.
  // all=1 (bill gallery) also lists the bills already attached to transactions.
  const includeMatched = request.query.all === '1';
  const bills = await pool.query(`SELECT b.id, 'bill' AS source, b.file_name AS "fileName", b.file_size_bytes AS "fileSizeBytes", b.mime_type AS "mimeType", b.created_at AS "createdAt", u.name AS "uploadedBy", b.ai_status AS "aiStatus", to_char(b.bill_date, 'YYYY-MM-DD') AS "billDate", b.bill_total AS "billTotal", b.bill_gst AS "billGst", b.bill_pst AS "billPst", b.bill_vendor AS "billVendor", NULL::uuid AS "transactionId", NULL AS "transactionMerchant", NULL::numeric AS "transactionAmount", NULL AS "transactionDate", ba.name AS "bankAccountName", ba.masked_number AS "bankAccountNumber"
     FROM uploaded_bills b JOIN app_users u ON u.id = b.uploaded_by LEFT JOIN bank_accounts ba ON ba.id = b.bank_account_id
     WHERE b.business_id = $1 AND b.transaction_id IS NULL AND ($2::uuid IS NULL OR b.bank_account_id = $2)
     UNION ALL
     SELECT t.id, 'transaction' AS source, t.bill_name, t.bill_size_bytes, t.bill_mime_type, COALESCE(t.bill_mapped_at, t.updated_at), COALESCE(u.name, 'AI'), 'done', to_char(t.posted_on, 'YYYY-MM-DD'), ABS(t.amount), t.gst, t.pst, t.merchant, t.id, t.merchant, t.amount, to_char(t.posted_on, 'YYYY-MM-DD'), ba.name, ba.masked_number
     FROM transactions t LEFT JOIN app_users u ON u.id = t.bill_uploaded_by LEFT JOIN bank_accounts ba ON ba.id = t.bank_account_id
     WHERE $3::boolean AND t.business_id = $1 AND t.bill_status = 'attached' AND t.bill_file_path IS NOT NULL AND ($2::uuid IS NULL OR t.bank_account_id = $2)
     ORDER BY "createdAt" DESC`, [businessId, bankAccountId, includeMatched]);
  return response.json({ bills: bills.rows });
}));

app.get('/bills/:billId/file', requireAuth, asyncRoute(async (request: AuthenticatedRequest, response) => {
  const bill = await pool.query<{ file_path: string; mime_type: string; file_name: string }>(`SELECT b.file_path, b.mime_type, b.file_name FROM uploaded_bills b JOIN user_business_access uba ON uba.business_id = b.business_id AND uba.user_id = $2 WHERE b.id = $1`, [request.params.billId, request.authUser!.id]);
  if (!bill.rowCount) return response.status(404).json({ error: 'Bill not found.' });
  response.type(bill.rows[0].mime_type);
  return response.sendFile(path.resolve(uploadDirectory, bill.rows[0].file_path), { headers: { 'Content-Disposition': `inline; filename="${bill.rows[0].file_name.replace(/"/g, '')}"` } });
}));

app.get('/transactions/:transactionId', requireAuth, asyncRoute(async (request: AuthenticatedRequest, response) => {
  const result = await pool.query(`SELECT t.id, t.business_id AS "businessId", t.bank_account_id AS "bankAccountId", t.posted_on AS "postedOn", t.merchant, t.description, t.amount, t.category, t.gst, t.pst, t.memo, t.bill_status AS "billStatus", t.bill_name AS "billName", t.bill_size_bytes AS "billSizeBytes", ba.name AS "bankAccountName", ba.masked_number AS "bankAccountNumber", uploader.name AS "billUploadedBy", CASE WHEN t.bill_mapped_by = 'ai' THEN 'AI' ELSE mapper.name END AS "billMappedBy", t.bill_mapped_at AS "billMappedAt" FROM transactions t JOIN user_business_access uba ON uba.business_id = t.business_id AND uba.user_id = $2 LEFT JOIN bank_accounts ba ON ba.id = t.bank_account_id LEFT JOIN app_users uploader ON uploader.id = t.bill_uploaded_by LEFT JOIN app_users mapper ON mapper.id::text = t.bill_mapped_by WHERE t.id = $1`, [request.params.transactionId, request.authUser!.id]);
  if (!result.rowCount) return response.status(404).json({ error: 'Transaction not found.' });
  return response.json({ transaction: result.rows[0] });
}));

/** Category list like OATRx: the standard list, categories users added, and any already used. A–Z. */
app.get('/categories', requireAuth, asyncRoute(async (request: AuthenticatedRequest, response) => {
  const businessId = typeof request.query.businessId === 'string' ? request.query.businessId : '';
  if (businessId && !(await hasBusinessAccess(request.authUser!.id, businessId))) return response.status(403).json({ error: 'You do not have access to that business.' });
  const [custom, used] = await Promise.all([
    pool.query<{ name: string }>('SELECT name FROM transaction_categories'),
    pool.query<{ name: string }>(
      `SELECT DISTINCT t.category AS name FROM transactions t JOIN user_business_access uba ON uba.business_id = t.business_id AND uba.user_id = $1
       WHERE ($2::uuid IS NULL OR t.business_id = $2) AND t.category <> ''`,
      [request.authUser!.id, businessId || null]),
  ]);
  const byLower = new Map<string, string>();
  for (const name of [...STANDARD_CATEGORIES, ...custom.rows.map((row) => row.name), ...used.rows.map((row) => row.name)]) {
    const clean = name.trim();
    if (clean && !byLower.has(clean.toLowerCase())) byLower.set(clean.toLowerCase(), clean);
  }
  return response.json({ categories: [...byLower.values()].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' })) });
}));

/** Use the existing spelling of a category, or remember a new one the user typed. */
async function resolveCategoryName(name: string, userId: string) {
  const clean = name.trim().replace(/\s+/g, ' ').slice(0, 80);
  if (!clean) return 'Uncategorized';
  const standard = STANDARD_CATEGORIES.find((item) => item.toLowerCase() === clean.toLowerCase());
  if (standard) return standard;
  const existing = await pool.query<{ name: string }>('SELECT name FROM transaction_categories WHERE LOWER(name) = LOWER($1)', [clean]);
  if (existing.rowCount) return existing.rows[0].name;
  await pool.query('INSERT INTO transaction_categories (name, created_by) VALUES ($1, $2) ON CONFLICT DO NOTHING', [clean, userId]);
  return clean;
}

app.patch('/transactions/:transactionId', requireAuth, asyncRoute(async (request: AuthenticatedRequest, response) => {
  const fields = ['category', 'memo', 'gst', 'pst'] as const;
  const values = fields.map((field) => request.body?.[field]);
  if (values.some((value, index) => index < 2 ? value !== undefined && typeof value !== 'string' : value !== undefined && !Number.isFinite(Number(value)))) return response.status(400).json({ error: 'Invalid transaction details.' });
  if (typeof values[0] === 'string') {
    const access = await pool.query('SELECT 1 FROM transactions t JOIN user_business_access uba ON uba.business_id = t.business_id AND uba.user_id = $2 WHERE t.id = $1', [request.params.transactionId, request.authUser!.id]);
    if (!access.rowCount) return response.status(404).json({ error: 'Transaction not found.' });
    values[0] = await resolveCategoryName(values[0], request.authUser!.id);
  }
  const result = await pool.query(`UPDATE transactions AS t SET category = COALESCE($3, t.category), memo = COALESCE($4, t.memo), gst = COALESCE($5::numeric, t.gst), pst = COALESCE($6::numeric, t.pst), updated_at = NOW() FROM user_business_access uba WHERE t.id = $1 AND uba.business_id = t.business_id AND uba.user_id = $2 RETURNING t.id, t.category, t.memo, t.gst, t.pst`, [request.params.transactionId, request.authUser!.id, values[0] ?? null, values[1] ?? null, values[2] ?? null, values[3] ?? null]);
  if (!result.rowCount) return response.status(404).json({ error: 'Transaction not found.' });
  return response.json({ transaction: result.rows[0] });
}));

app.get('/transactions/:transactionId/bill/file', requireAuth, asyncRoute(async (request: AuthenticatedRequest, response) => {
  const result = await pool.query<{ bill_file_path: string; bill_mime_type: string; bill_name: string }>(`SELECT t.bill_file_path, t.bill_mime_type, t.bill_name FROM transactions t JOIN user_business_access uba ON uba.business_id = t.business_id AND uba.user_id = $2 WHERE t.id = $1 AND t.bill_file_path IS NOT NULL`, [request.params.transactionId, request.authUser!.id]);
  if (!result.rowCount) return response.status(404).json({ error: 'Bill not found.' });
  response.type(result.rows[0].bill_mime_type);
  return response.sendFile(path.resolve(uploadDirectory, result.rows[0].bill_file_path), { headers: { 'Content-Disposition': `inline; filename="${result.rows[0].bill_name.replace(/"/g, '')}"` } });
}));

app.post('/transactions/:transactionId/bill', requireAuth, acceptUpload(billUpload.single('file'), 'Bills can be up to 10 MB.'), asyncRoute(async (request: AuthenticatedRequest, response) => {
  const file = (request as AuthenticatedRequest & { file?: Express.Multer.File }).file;
  const billId = typeof request.body?.billId === 'string' ? request.body.billId : '';
  const transaction = await pool.query<{ business_id: string; bank_account_id: string | null }>(`SELECT t.business_id, t.bank_account_id FROM transactions t JOIN user_business_access uba ON uba.business_id = t.business_id AND uba.user_id = $2 WHERE t.id = $1`, [request.params.transactionId, request.authUser!.id]);
  if (!transaction.rowCount) return response.status(404).json({ error: 'Transaction not found.' });
  if (!file && !billId) return response.status(400).json({ error: 'Choose a bill image or an uploaded bill.' });
  if (file && !transaction.rows[0].bank_account_id) return response.status(400).json({ error: 'Transaction must have a bank account to attach a new bill image.' });

  let bill = file ? { fileName: file.originalname, fileSizeBytes: file.size, filePath: file.filename, mimeType: file.mimetype } : null;
  let uploadedBy = request.authUser!.id;
  if (billId) {
    const existing = await pool.query<{ file_name: string; file_size_bytes: number; file_path: string; mime_type: string; uploaded_by: string; bill_gst: string | null; bill_pst: string | null }>(`SELECT file_name, file_size_bytes, file_path, mime_type, uploaded_by, bill_gst, bill_pst FROM uploaded_bills WHERE id = $1 AND business_id = $2 AND transaction_id IS NULL AND bank_account_id IS NOT DISTINCT FROM $3`, [billId, transaction.rows[0].business_id, transaction.rows[0].bank_account_id]);
    if (!existing.rowCount) return response.status(404).json({ error: 'That available bill could not be matched to this transaction.' });
    const row = existing.rows[0];
    bill = { fileName: row.file_name, fileSizeBytes: row.file_size_bytes, filePath: row.file_path, mimeType: row.mime_type };
    uploadedBy = row.uploaded_by;
  }
  const result = await pool.query(`UPDATE transactions SET bill_status = 'attached', bill_name = $2, bill_size_bytes = $3, bill_file_path = $4, bill_mime_type = $5, bill_uploaded_by = $6,
      bill_mapped_by = $7, bill_mapped_at = NOW(),
      updated_at = NOW()
    WHERE id = $1 RETURNING id, bill_status AS "billStatus", bill_name AS "billName", bill_size_bytes AS "billSizeBytes", bill_mime_type AS "billMimeType", gst, pst`,
    [request.params.transactionId, bill!.fileName, bill!.fileSizeBytes, bill!.filePath, bill!.mimeType, uploadedBy, request.authUser!.id]);
  // OATRx removes the waiting bill once it is attached.
  if (billId) await pool.query('DELETE FROM uploaded_bills WHERE id = $1', [billId]);
  return response.json({ transaction: result.rows[0] });
}));

// Optional profile photo: an admin can set anyone's, everyone can set their own.
app.post('/users/:userId/avatar', requireAuth, imageUpload.single('file'), asyncRoute(async (request: AuthenticatedRequest, response) => {
  const userId = String(request.params.userId);
  const file = (request as AuthenticatedRequest & { file?: Express.Multer.File }).file;
  if (request.authUser!.role !== 'admin' && request.authUser!.id !== userId) return response.status(403).json({ error: 'You can only change your own photo.' });
  if (!file) return response.status(400).json({ error: 'Choose an image for the profile photo.' });
  const saved = await pool.query('UPDATE app_users SET avatar_path = $2, avatar_mime = $3, avatar_updated_at = NOW() WHERE id = $1 RETURNING avatar_updated_at AS "avatarUpdatedAt"', [userId, file.filename, file.mimetype]);
  if (!saved.rowCount) return response.status(404).json({ error: 'User not found.' });
  return response.json(saved.rows[0]);
}));

app.get('/users/:userId/avatar', requireAuth, asyncRoute(async (request: AuthenticatedRequest, response) => {
  const found = await pool.query<{ avatar_path: string | null; avatar_mime: string | null }>('SELECT avatar_path, avatar_mime FROM app_users WHERE id = $1', [String(request.params.userId)]);
  const avatar = found.rows[0];
  if (!avatar?.avatar_path) return response.status(404).json({ error: 'This user has no photo.' });
  response.type(avatar.avatar_mime ?? 'image/jpeg');
  return response.sendFile(path.resolve(uploadDirectory, avatar.avatar_path));
}));

app.get('/users', requireAuth, requireAdmin, asyncRoute(async (_request: AuthenticatedRequest, response) => {
  const users = await pool.query(`SELECT u.id, u.email, u.name, u.role, u.is_active AS "isActive", u.is_seed_admin AS "isSeedAdmin", u.created_at AS "createdAt", u.avatar_updated_at AS "avatarUpdatedAt", COALESCE(json_agg(json_build_object('id', b.id, 'name', b.name, 'slug', b.slug) ORDER BY b.name) FILTER (WHERE b.id IS NOT NULL), '[]') AS businesses FROM app_users u LEFT JOIN user_business_access uba ON uba.user_id = u.id LEFT JOIN businesses b ON b.id = uba.business_id AND b.is_active = TRUE GROUP BY u.id ORDER BY u.created_at`);
  return response.json({ users: users.rows });
}));

app.post('/users', requireAuth, requireAdmin, asyncRoute(async (request: AuthenticatedRequest, response) => {
  const name = typeof request.body?.name === 'string' ? request.body.name.trim() : '';
  const email = typeof request.body?.email === 'string' ? normalizeEmail(request.body.email) : '';
  // Like OATRx finance users there is no role to pick: new users are staff unless a valid role is sent.
  const requestedRole = request.body?.role;
  const role: Role = ['admin', 'staff', 'accountant'].includes(requestedRole) ? requestedRole : 'staff';
  const businessIds = Array.isArray(request.body?.businessIds) ? request.body.businessIds.filter((id: unknown) => typeof id === 'string') : [];
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return response.status(400).json({ error: 'Enter a valid email address.' });
  const displayName = name || email.split('@')[0];
  if ((await pool.query('SELECT id FROM app_users WHERE LOWER(email) = LOWER($1)', [email])).rowCount) return response.status(409).json({ error: 'A user with this email already exists.' });
  await pool.query('BEGIN');
  try {
    const created = await pool.query<{ id: string; email: string; name: string; role: Role; is_seed_admin: boolean }>('INSERT INTO app_users (email, name, role) VALUES ($1, $2, $3) RETURNING id, email, name, role, is_seed_admin', [email, displayName, role]);
    const user = created.rows[0];
    if (businessIds.length) await pool.query('INSERT INTO user_business_access (user_id, business_id) SELECT $1, id FROM businesses WHERE id = ANY($2::uuid[]) AND is_active = TRUE ON CONFLICT DO NOTHING', [user.id, businessIds]);
    await pool.query('COMMIT');
    return response.status(201).json({ user: userResponse(user), businesses: await accessibleBusinesses(user.id) });
  } catch (error) { await pool.query('ROLLBACK'); throw error; }
}));

app.patch('/users/:userId', requireAuth, requireAdmin, asyncRoute(async (request: AuthenticatedRequest, response) => {
  const role = request.body?.role as Role | undefined;
  const isActive = request.body?.isActive;
  if (role !== undefined && !['admin', 'staff', 'accountant'].includes(role)) return response.status(400).json({ error: 'Invalid role.' });
  if (isActive !== undefined && typeof isActive !== 'boolean') return response.status(400).json({ error: 'isActive must be true or false.' });
  const updated = await pool.query(`UPDATE app_users SET role = COALESCE($2, role), is_active = COALESCE($3, is_active), updated_at = NOW() WHERE id = $1 RETURNING id, email, name, role, is_active AS "isActive", is_seed_admin AS "isSeedAdmin"`, [request.params.userId, role ?? null, isActive ?? null]);
  if (!updated.rowCount) return response.status(404).json({ error: 'User not found.' });
  return response.json({ user: updated.rows[0] });
}));

app.put('/users/:userId/businesses', requireAuth, requireAdmin, asyncRoute(async (request: AuthenticatedRequest, response) => {
  const userId = String(request.params.userId);
  const businessIds = Array.isArray(request.body?.businessIds) ? request.body.businessIds.filter((id: unknown) => typeof id === 'string') : null;
  if (!businessIds) return response.status(400).json({ error: 'businessIds must be an array.' });
  if (!(await pool.query('SELECT id FROM app_users WHERE id = $1', [userId])).rowCount) return response.status(404).json({ error: 'User not found.' });
  await pool.query('BEGIN');
  try {
    await pool.query('DELETE FROM user_business_access WHERE user_id = $1', [userId]);
    if (businessIds.length) await pool.query('INSERT INTO user_business_access (user_id, business_id) SELECT $1, id FROM businesses WHERE id = ANY($2::uuid[]) AND is_active = TRUE ON CONFLICT DO NOTHING', [userId, businessIds]);
    await pool.query('COMMIT');
  } catch (error) { await pool.query('ROLLBACK'); throw error; }
  return response.json({ businesses: await accessibleBusinesses(userId) });
}));

app.use((_request, response) => response.status(404).json({ error: 'Route not found.' }));
app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => { console.error(error); response.status(500).json({ error: 'An unexpected server error occurred.' }); });
app.listen(port, () => {
  startBillWorker(uploadDirectory);
  console.log(`MediAccounts backend is running at http://localhost:${port}`);
  void verifyEmailDelivery();
});
