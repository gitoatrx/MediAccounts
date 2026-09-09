export const API_BASE_URL =
  process.env.EXPO_PUBLIC_MEDIACCOUNTS_API_URL ?? "http://10.0.2.2:4000";

type ApiError = { error?: string };

export type AuthSession = {
  token: string;
  expiresAt: string;
  user: { id: string; email: string; name: string; role: "admin" | "staff" | "accountant"; isSeedAdmin: boolean };
  businesses: Array<{ id: string; name: string; slug: string }>;
};

export type ManagedUser = {
  id: string;
  email: string;
  name: string;
  role: "admin" | "staff" | "accountant";
  isActive: boolean;
  isSeedAdmin: boolean;
  businesses: Array<{ id: string; name: string; slug: string }>;
};

export type FinanceTransaction = {
  id: string; businessId: string; bankAccountId: string | null; postedOn: string; postedLabel: string;
  merchant: string; description: string; amount: string | number; category: string; gst: string | number;
  pst: string | number; memo: string; billStatus: 'missing' | 'attached'; billName: string | null;
  billSizeBytes: number | null; billMimeType?: string | null; bankAccountName: string | null; bankAccountNumber: string | null; billUploadedBy: string | null;
};

export type AvailableBill = { id: string; fileName: string; fileSizeBytes: number; mimeType: string; createdAt: string; uploadedBy: string };

export type Workspace = {
  businesses: AuthSession['businesses'];
  activeBusiness: AuthSession['businesses'][number] | null;
  bankAccounts: Array<{ id: string; name: string; maskedNumber: string; accountType: string; balance: string | number }>;
  transactions: FinanceTransaction[];
  dashboard: null | { spent: string | number; categoryCount: number; billsMissing: number; gstClaimable: string | number; transactionCount: number };
  charts: { categories: Array<{ name: string; amount: string | number }>; months: Array<{ month: string; amount: string | number }> };
  report: null | { spent: string | number; gstClaimable: string | number; billsMissing: number; transactionCount: number };
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
  });
  const body = (await response.json().catch(() => ({}))) as T & ApiError;
  if (!response.ok) throw new Error(body.error ?? "Unable to reach MediAccounts.");
  return body;
}

export function requestLoginCode(email: string) {
  return request<{ message: string; expiresInMinutes: number }>("/auth/request-code", {
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

export function getWorkspace(token: string, businessId?: string) {
  return request<Workspace>(`/workspace${businessId ? `?businessId=${encodeURIComponent(businessId)}` : ''}`, { headers: { Authorization: `Bearer ${token}` } });
}

export type NewInstitution = { name: string; accountNumber: string; accountType: string; isPrimary: boolean };
export function createBusiness(token: string, input: { name: string; aliasName?: string; businessAddress: string; addressLine2?: string; city?: string; province?: string; postalCode?: string; institutions: NewInstitution[] }) {
  return request<{ business: AuthSession['businesses'][number] }>('/businesses', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(input) });
}

export function createBankAccount(token: string, businessId: string, input: { name: string; accountNumber: string; balance?: number; accountType?: string }) {
  return request<{ account: Workspace['bankAccounts'][number] }>(`/businesses/${businessId}/accounts`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(input) });
}

export function createTransaction(token: string, input: { businessId: string; bankAccountId?: string | null; postedOn: string; merchant: string; description?: string; amount: number; category?: string; gst?: number; pst?: number; memo?: string }) {
  return request<{ transaction: { id: string } }>('/transactions', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(input) });
}

export function updateTransaction(token: string, transactionId: string, input: Partial<Pick<FinanceTransaction, 'category' | 'memo' | 'gst' | 'pst'>>) {
  return request<{ transaction: Pick<FinanceTransaction, 'id' | 'category' | 'memo' | 'gst' | 'pst'> }>(`/transactions/${transactionId}`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(input) });
}

export async function uploadBill(token: string, transactionId: string, file: { uri: string; name: string; mimeType?: string | null }) {
  const form = new FormData();
  form.append('file', new File(file.uri));
  const response = await expoFetch(`${API_BASE_URL}/transactions/${transactionId}/bill`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
  const body = await response.json().catch(() => ({})) as { error?: string; transaction?: Pick<FinanceTransaction, 'id' | 'billStatus' | 'billName' | 'billSizeBytes'> };
  if (!response.ok) throw new Error(body.error ?? 'Unable to upload the bill.');
  return body as { transaction: Pick<FinanceTransaction, 'id' | 'billStatus' | 'billName' | 'billSizeBytes'> };
}

export async function attachExistingBill(token: string, transactionId: string, billId: string) {
  const form = new FormData();
  form.append('billId', billId);
  const response = await expoFetch(`${API_BASE_URL}/transactions/${transactionId}/bill`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
  const body = await response.json().catch(() => ({})) as { error?: string; transaction?: FinanceTransaction };
  if (!response.ok) throw new Error(body.error ?? 'Unable to attach the bill.');
  return body as { transaction: FinanceTransaction };
}

export function getAvailableBills(token: string, businessId: string, bankAccountId?: string | null) {
  const params = `businessId=${encodeURIComponent(businessId)}${bankAccountId ? `&bankAccountId=${encodeURIComponent(bankAccountId)}` : ''}`;
  return request<{ bills: AvailableBill[] }>(`/bills?${params}`, { headers: { Authorization: `Bearer ${token}` } });
}

export function billFileUrl(billId: string) { return `${API_BASE_URL}/bills/${billId}/file`; }
export function transactionBillFileUrl(transactionId: string) { return `${API_BASE_URL}/transactions/${transactionId}/bill/file`; }

// Android's Image component does not reliably send the Authorization header when
// it loads a remote image. Download the protected bill to the app cache first so
// it can be displayed from a local file URI instead.
export async function downloadBillPreview(token: string, url: string, cacheKey: string, mimeType?: string | null) {
  const response = await expoFetch(url, { headers: { Authorization: `Bearer ${token}` } });
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
  const response = await expoFetch(`${API_BASE_URL}/bills`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
  const body = await response.json().catch(() => ({})) as { error?: string; bill?: { id: string } };
  if (!response.ok) throw new Error(body.error ?? 'Unable to upload the bill.');
  return body;
}

export async function importTransactionsCsv(token: string, input: { businessId: string; bankAccountId?: string | null; file: { uri: string; name: string; mimeType?: string | null } }) {
  const form = new FormData();
  form.append('businessId', input.businessId);
  if (input.bankAccountId) form.append('bankAccountId', input.bankAccountId);
  form.append('file', new File(input.file.uri));
  const response = await expoFetch(`${API_BASE_URL}/transactions/import-csv`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
  const body = await response.json().catch(() => ({})) as { error?: string; imported?: number; skippedRows?: number[]; totalRows?: number };
  if (!response.ok) throw new Error(body.error ?? 'Unable to import the CSV.');
  return body as { imported: number; skippedRows: number[]; totalRows: number };
}

export function updateProfile(token: string, input: { name?: string; phone?: string }) {
  return request<{ user: AuthSession['user']; phone: string }>('/profile', { method: 'PATCH', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(input) });
}
import { File, Paths } from 'expo-file-system';
import { fetch as expoFetch } from 'expo/fetch';
