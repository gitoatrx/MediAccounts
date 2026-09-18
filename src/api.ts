export const API_BASE_URL =
  process.env.EXPO_PUBLIC_MEDIACCOUNTS_API_URL ?? "http://127.0.0.1:4000";

type ApiError = { error?: string };

/** Carries the HTTP status and response body so callers can react to e.g. 429 cooldowns. */
export class ApiRequestError extends Error {
  constructor(message: string, readonly status: number, readonly data: Record<string, unknown>) {
    super(message);
    this.name = "ApiRequestError";
  }
}

// Share identical reads while a screen is loading. This prevents concurrent
// workspace/category requests during navigation without caching stale data.
const inFlightGets = new Map<string, Promise<unknown>>();
const REQUEST_TIMEOUT_MS = 15000;

// API calls use the MediAccounts session token directly. It is validated with a
// single database lookup, so no Firebase token refresh or Google round trip is needed.
function bearer(token: string) {
  return `Bearer ${token}`;
}

export type AuthSession = {
  token: string;
  firebaseToken?: string | null;
  expiresAt: string;
  user: { id: string; email: string; name: string; role: "admin" | "staff" | "accountant"; isSeedAdmin: boolean };
  businesses: Array<{ id: string; name: string; slug: string; logoUpdatedAt?: string | null }>;
};

export type ManagedUser = {
  id: string;
  email: string;
  name: string;
  role: "admin" | "staff" | "accountant";
  isActive: boolean;
  isSeedAdmin: boolean;
  /** Set when the user has a profile photo. */
  avatarUpdatedAt?: string | null;
  businesses: Array<{ id: string; name: string; slug: string }>;
};

export type FinanceTransaction = {
  id: string; businessId: string; bankAccountId: string | null; postedOn: string; postedLabel: string;
  merchant: string; description: string; amount: string | number; category: string; gst: string | number;
  pst: string | number; memo: string; billStatus: 'missing' | 'attached'; billName: string | null;
  billSizeBytes: number | null; billMimeType?: string | null; bankAccountName: string | null; bankAccountNumber: string | null; billUploadedBy: string | null;
  /** "AI" when the bill was matched automatically, otherwise the person who attached it. */
  billMappedBy?: string | null; billMappedAt?: string | null;
  /** When the row was saved; rows from one CSV import share the same second. */
  createdAt?: string;
};

export type AvailableBill = {
  id: string; fileName: string; fileSizeBytes: number; mimeType: string; createdAt: string; uploadedBy: string;
  /** AI reading: pending, processing, done, failed, unreadable, unsupported (PDF) or skipped. */
  aiStatus?: string; billDate?: string | null; billTotal?: string | number | null; billGst?: string | number | null; billPst?: string | number | null; billVendor?: string | null;
};

export type Workspace = {
  businesses: AuthSession['businesses'];
  activeBusiness: AuthSession['businesses'][number] | null;
  bankAccounts: Array<{ id: string; name: string; maskedNumber: string; accountType: string; balance: string | number; isPrimary?: boolean; cardType?: string | null }>;
  transactions: FinanceTransaction[];
  dashboard: null | { spent: string | number; categoryCount: number; billsMissing: number; gstClaimable: string | number; transactionCount: number };
  charts: { categories: Array<{ name: string; amount: string | number }>; months: Array<{ month: string; amount: string | number }> };
  report: null | { spent: string | number; gstClaimable: string | number; billsMissing: number; transactionCount: number };
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  const auth = String((options.headers as Record<string, string> | undefined)?.Authorization ?? "");
  const key = `${method}:${path}:${auth}`;
  if (method === "GET") {
    const existing = inFlightGets.get(key) as Promise<T> | undefined;
    if (existing) return existing;
  }
  const execute = (async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        signal: options.signal ?? controller.signal,
        headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
      });
      const body = (await response.json().catch(() => ({}))) as T & ApiError;
      if (!response.ok) throw new ApiRequestError(body.error ?? "Unable to reach MediAccounts.", response.status, body as Record<string, unknown>);
      return body;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") throw new Error("Request timed out. Check your connection and try again.");
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  })();
  if (method === "GET") {
    inFlightGets.set(key, execute);
    execute.finally(() => inFlightGets.delete(key)).catch(() => undefined);
  }
  return execute;
}

export function requestLoginCode(email: string) {
  return request<{ message: string; email: string; expiresInMinutes: number; resendAfterSeconds: number; devCode?: string }>("/auth/request-code", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function verifyLoginCode(email: string, code: string) {
  return request<AuthSession>("/auth/verify-code", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });
}

export function signInWithGoogle(googleIdToken: string) {
  return request<AuthSession>("/auth/google", {
    method: "POST",
    body: JSON.stringify({ idToken: googleIdToken }),
  });
}

export function getCurrentSession(token: string) {
  return request<Omit<AuthSession, "token" | "expiresAt">>("/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function logoutSession(token: string) {
  return request<void>("/auth/logout", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getUsers(token: string) {
  return request<{ users: ManagedUser[] }>("/users", { headers: { Authorization: `Bearer ${token}` } });
}

export function createUser(token: string, input: { name: string; email: string; role: "staff" | "accountant"; businessIds: string[] }) {
  return request<{ user: ManagedUser; businesses: AuthSession["businesses"] }>("/users", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
  });
}

export function updateUser(token: string, userId: string, input: { role?: "admin" | "staff" | "accountant"; isActive?: boolean }) {
  return request<{ user: ManagedUser }>(`/users/${userId}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
  });
}

export function updateUserBusinesses(token: string, userId: string, businessIds: string[]) {
  return request<{ businesses: ManagedUser["businesses"] }>(`/users/${userId}/businesses`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ businessIds }),
  });
}

export function getWorkspace(token: string, businessId?: string) {
  return request<Workspace>(`/workspace${businessId ? `?businessId=${encodeURIComponent(businessId)}` : ''}`, { headers: { Authorization: `Bearer ${token}` } });
}

export type NewInstitution = { name: string; accountNumber: string; accountType: string; isPrimary: boolean; cardType?: string | null };
export function createBusiness(token: string, input: { name: string; aliasName?: string; businessAddress: string; addressLine2?: string; city?: string; province?: string; postalCode?: string; institutions: NewInstitution[] }) {
  return request<{ business: AuthSession['businesses'][number] }>('/businesses', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(input) });
}

export function getBusinessAccounts(token: string, businessId: string) {
  return request<{ accounts: Workspace['bankAccounts'] }>(`/businesses/${encodeURIComponent(businessId)}/accounts`, { headers: { Authorization: `Bearer ${token}` } });
}

export type AddressSuggestion = { placeId: string; primary: string; secondary: string };
export type AddressDetails = { businessAddress: string; addressLine2: string; city: string; province: string; postalCode: string; country: string; formattedAddress: string };

export function searchAddresses(token: string, input: string, sessionToken: string) {
  return request<{ suggestions: AddressSuggestion[] }>(`/places/autocomplete?input=${encodeURIComponent(input)}&sessionToken=${encodeURIComponent(sessionToken)}`, { headers: { Authorization: `Bearer ${token}` } });
}

export function getAddressDetails(token: string, placeId: string, sessionToken: string) {
  return request<{ address: AddressDetails }>(`/places/${encodeURIComponent(placeId)}?sessionToken=${encodeURIComponent(sessionToken)}`, { headers: { Authorization: `Bearer ${token}` } });
}

export type BusinessDetails = { id: string; name: string; slug?: string; aliasName: string; businessAddress: string; addressLine2: string; city: string; province: string; postalCode: string; logoUpdatedAt?: string | null };
export type BankExportDetails = { institutionNumber: string; transitNumber: string; accountNumberLast4: string; hasAccountNumber: boolean; micrRoutingNumber: string; lastChequeNumber: string; bankAddress: string; bankAddressLine2: string; bankCity: string; bankProvince: string; bankPostalCode: string; chequeImageName: string; updatedAt: string | null };
export type BankExportInput = Omit<BusinessDetails, 'id' | 'slug' | 'name' | 'logoUpdatedAt'> & { businessName: string; institutionNumber: string; transitNumber: string; accountNumber: string; micrRoutingNumber: string; lastChequeNumber: string; bankAddress: string; bankAddressLine2: string; bankCity: string; bankProvince: string; bankPostalCode: string };

export function getBusiness(token: string, businessId: string) {
  return request<{ business: BusinessDetails }>(`/businesses/${encodeURIComponent(businessId)}`, { headers: { Authorization: `Bearer ${token}` } });
}

export function updateBusiness(token: string, businessId: string, input: Omit<BusinessDetails, 'id' | 'slug'>) {
  return request<{ business: BusinessDetails }>(`/businesses/${encodeURIComponent(businessId)}`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(input) });
}

export function updateBankAccount(token: string, businessId: string, accountId: string, input: { name: string; accountType: string; accountNumber?: string; isPrimary: boolean; cardType?: string | null }) {
  return request<{ account: Workspace['bankAccounts'][number] }>(`/businesses/${encodeURIComponent(businessId)}/accounts/${encodeURIComponent(accountId)}`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(input) });
}

export function deleteBusiness(token: string, businessId: string) {
  return request<void>(`/businesses/${encodeURIComponent(businessId)}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
}

export function deleteBankAccount(token: string, businessId: string, accountId: string) {
  return request<void>(`/businesses/${encodeURIComponent(businessId)}/accounts/${encodeURIComponent(accountId)}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
}

export function getBankExport(token: string, businessId: string, accountId: string) {
  return request<{ business: BusinessDetails; account: Workspace['bankAccounts'][number]; details: BankExportDetails }>(`/businesses/${encodeURIComponent(businessId)}/accounts/${encodeURIComponent(accountId)}/export`, { headers: { Authorization: `Bearer ${token}` } });
}

export async function saveBankExport(token: string, businessId: string, accountId: string, input: BankExportInput, chequeImage?: { uri: string } | null) {
  const form = new FormData();
  Object.entries(input).forEach(([key, value]) => form.append(key, value));
  if (chequeImage) form.append('chequeImage', new File(chequeImage.uri));
  const response = await expoFetch(`${API_BASE_URL}/businesses/${encodeURIComponent(businessId)}/accounts/${encodeURIComponent(accountId)}/export`, { method: 'PUT', headers: { Authorization: bearer(token) }, body: form });
  const body = await response.json().catch(() => ({})) as { error?: string; details?: BankExportDetails };
  if (!response.ok) throw new Error(body.error ?? 'Unable to save the bank details.');
  return body as { details: BankExportDetails };
}

/** Downloads the bank export package to the app cache and returns its file URI. */
export async function downloadBankExport(token: string, businessId: string, accountId: string, fileName: string) {
  const response = await expoFetch(`${API_BASE_URL}/businesses/${encodeURIComponent(businessId)}/accounts/${encodeURIComponent(accountId)}/export/file`, { headers: { Authorization: bearer(token) } });
  const text = await response.text();
  if (!response.ok) {
    let message = 'Unable to export the bank details.';
    try { message = (JSON.parse(text) as { error?: string }).error ?? message; } catch { /* not JSON */ }
    throw new Error(message);
  }
  const file = new File(Paths.cache, fileName);
  file.create({ overwrite: true, intermediates: true });
  file.write(text);
  return file.uri;
}

export function createBankAccount(token: string, businessId: string, input: { name: string; accountNumber: string; balance?: number; accountType?: string; isPrimary?: boolean; cardType?: string | null }) {
  return request<{ account: Workspace['bankAccounts'][number] }>(`/businesses/${businessId}/accounts`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(input) });
}

export function createTransaction(token: string, input: { businessId: string; bankAccountId?: string | null; postedOn: string; merchant: string; description?: string; amount: number; category?: string; gst?: number; pst?: number; memo?: string }) {
  return request<{ transaction: { id: string } }>('/transactions', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(input) });
}

/** Category list for the picker (standard, user-added and already used), A–Z. */
export function getCategories(token: string, businessId?: string | null) {
  const query = businessId ? `?businessId=${encodeURIComponent(businessId)}` : '';
  return request<{ categories: string[] }>(`/categories${query}`, { headers: { Authorization: `Bearer ${token}` } });
}

export function updateTransaction(token: string, transactionId: string, input: Partial<Pick<FinanceTransaction, 'category' | 'memo' | 'gst' | 'pst'>>) {
  return request<{ transaction: Pick<FinanceTransaction, 'id' | 'category' | 'memo' | 'gst' | 'pst'> }>(`/transactions/${transactionId}`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(input) });
}

export async function uploadBill(token: string, transactionId: string, file: { uri: string; name: string; mimeType?: string | null }) {
  const form = new FormData();
  form.append('file', new File(file.uri));
  const response = await expoFetch(`${API_BASE_URL}/transactions/${transactionId}/bill`, { method: 'POST', headers: { Authorization: bearer(token) }, body: form });
  const body = await response.json().catch(() => ({})) as { error?: string; transaction?: Pick<FinanceTransaction, 'id' | 'billStatus' | 'billName' | 'billSizeBytes'> };
  if (!response.ok) throw new Error(body.error ?? 'Unable to upload the bill.');
  return body as { transaction: Pick<FinanceTransaction, 'id' | 'billStatus' | 'billName' | 'billSizeBytes'> };
}

export async function attachExistingBill(token: string, transactionId: string, billId: string) {
  const form = new FormData();
  form.append('billId', billId);
  const response = await expoFetch(`${API_BASE_URL}/transactions/${transactionId}/bill`, { method: 'POST', headers: { Authorization: bearer(token) }, body: form });
  const body = await response.json().catch(() => ({})) as { error?: string; transaction?: FinanceTransaction };
  if (!response.ok) throw new Error(body.error ?? 'Unable to attach the bill.');
  return body as { transaction: FinanceTransaction };
}

export function getAvailableBills(token: string, businessId: string, bankAccountId?: string | null) {
  const params = `businessId=${encodeURIComponent(businessId)}${bankAccountId ? `&bankAccountId=${encodeURIComponent(bankAccountId)}` : ''}`;
  return request<{ bills: AvailableBill[] }>(`/bills?${params}`, { headers: { Authorization: `Bearer ${token}` } });
}

export type GalleryBill = AvailableBill & {
  /** "bill" = still waiting, "transaction" = already attached to a transaction. */
  source?: 'bill' | 'transaction';
  transactionId?: string | null; transactionMerchant?: string | null; transactionAmount?: string | number | null; transactionDate?: string | null;
  bankAccountName?: string | null; bankAccountNumber?: string | null;
};

/** Every bill uploaded for a business, matched or not (bill gallery). */
export function getBillGallery(token: string, businessId: string) {
  return request<{ bills: GalleryBill[] }>(`/bills?businessId=${encodeURIComponent(businessId)}&all=1`, { headers: { Authorization: `Bearer ${token}` } });
}

export function billFileUrl(billId: string) { return `${API_BASE_URL}/bills/${billId}/file`; }
export function transactionBillFileUrl(transactionId: string) { return `${API_BASE_URL}/transactions/${transactionId}/bill/file`; }

// Android's Image component does not reliably send the Authorization header when
// it loads a remote image. Download the protected bill to the app cache first so
// it can be displayed from a local file URI instead.
export async function downloadBillPreview(token: string, url: string, cacheKey: string, mimeType?: string | null) {
  const response = await expoFetch(url, { headers: { Authorization: bearer(token) } });
  if (!response.ok) throw new Error('Unable to load the bill image.');
  const extension = mimeType?.includes('png') ? 'png' : mimeType?.includes('webp') ? 'webp' : 'jpg';
  const file = new File(Paths.cache, `mediaccounts-bill-${cacheKey}.${extension}`);
  file.create({ overwrite: true, intermediates: true });
  file.write(await response.bytes());
  return file.uri;
}

export async function uploadStandaloneBill(token: string, input: { businessId: string; bankAccountId?: string | null; file: { uri: string; name: string; mimeType?: string | null } }) {
  const form = new FormData();
  form.append('businessId', input.businessId);
  if (input.bankAccountId) form.append('bankAccountId', input.bankAccountId);
  form.append('file', new File(input.file.uri));
  const response = await expoFetch(`${API_BASE_URL}/bills`, { method: 'POST', headers: { Authorization: bearer(token) }, body: form });
  const body = await response.json().catch(() => ({})) as { error?: string; bill?: { id: string }; aiReading?: boolean };
  if (!response.ok) throw new Error(body.error ?? 'Unable to upload the bill.');
  return body;
}

type PickedImage = { uri: string; name: string; mimeType?: string | null };

async function uploadImage(token: string, path: string, image: PickedImage, fallbackError: string) {
  const form = new FormData();
  form.append('file', new File(image.uri));
  const response = await expoFetch(`${API_BASE_URL}${path}`, { method: 'POST', headers: { Authorization: bearer(token) }, body: form });
  const body = await response.json().catch(() => ({})) as { error?: string; logoUpdatedAt?: string; avatarUpdatedAt?: string };
  if (!response.ok) throw new Error(body.error ?? fallbackError);
  return body;
}

/** Optional business logo. */
export function uploadBusinessLogo(token: string, businessId: string, image: PickedImage) {
  return uploadImage(token, `/businesses/${businessId}/logo`, image, 'Unable to upload the logo.');
}
export async function deleteBusinessLogo(token: string, businessId: string) {
  return request<{ logoUpdatedAt: null }>(`/businesses/${businessId}/logo`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
}
export function businessLogoUrl(businessId: string) { return `${API_BASE_URL}/businesses/${businessId}/logo`; }

/** Optional user profile photo. */
export function uploadUserAvatar(token: string, userId: string, image: PickedImage) {
  return uploadImage(token, `/users/${userId}/avatar`, image, 'Unable to upload the photo.');
}
export function userAvatarUrl(userId: string) { return `${API_BASE_URL}/users/${userId}/avatar`; }

export type CsvImportResult = {
  imported: number;
  /** Rows already saved whose category was updated from the file. */
  categoryUpdates?: number;
  duplicates: number;
  skippedRows: number[];
  totalRows: number;
  categorized?: { fromFile: number; fixedRules: number; learnedRules: number; ai: number; keywords: number };
  ai?: { configured: boolean; failed: boolean };
  /** Bills uploaded earlier that were attached to the imported transactions. */
  matchedBills?: number;
};

export async function importTransactionsCsv(token: string, input: { businessId: string; bankAccountId?: string | null; file: { uri: string; name: string; mimeType?: string | null } }) {
  const form = new FormData();
  form.append('businessId', input.businessId);
  if (input.bankAccountId) form.append('bankAccountId', input.bankAccountId);
  form.append('file', new File(input.file.uri));
  const response = await expoFetch(`${API_BASE_URL}/transactions/import-csv`, { method: 'POST', headers: { Authorization: bearer(token) }, body: form });
  const body = await response.json().catch(() => ({})) as { error?: string } & Partial<CsvImportResult>;
  if (!response.ok) throw new Error(body.error ?? 'Unable to import the CSV.');
  return { imported: body.imported ?? 0, duplicates: body.duplicates ?? 0, categoryUpdates: body.categoryUpdates ?? 0, skippedRows: body.skippedRows ?? [], totalRows: body.totalRows ?? 0, categorized: body.categorized, ai: body.ai };
}

export function getProfile(token: string) {
  return request<{ user: AuthSession['user']; phone: string }>('/profile', { headers: { Authorization: `Bearer ${token}` } });
}

export function updateProfile(token: string, input: { name?: string; phone?: string }) {
  return request<{ user: AuthSession['user']; phone: string }>('/profile', { method: 'PATCH', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(input) });
}
import { File, Paths } from 'expo-file-system';
import { fetch as expoFetch } from 'expo/fetch';
