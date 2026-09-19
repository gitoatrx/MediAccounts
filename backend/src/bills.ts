// Bill reading and automatic matching, following the OATRx finance-bill flow:
// 1. Upload (bank required): the photo is read by Azure OpenAI (date, total, GST, PST, vendor)
//    and attached right away to a transaction of the SAME BANK with the same date and amount
//    (within 1 cent) that has no bill yet (OATRx ProcessSingleFinanceBill).
// 2. CSV import: each new row, in file order, takes the first read, unmatched bill of the
//    imported bank with the same date and amount (OATRx importExpenses).
// 3. Every night at 23:55 all unmatched bills are read again if needed and matched
//    (OATRx finance:process-bills).
// One bill attaches to one transaction; GST/PST from the bill replace the transaction's values.
// A matched bill row is deleted, as in OATRx; the image itself lives on the transaction.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { azureConfig, azureJsonChat, AzureRequestError } from './azureOpenAi.js';
import { pool } from './db.js';

const MAX_ATTEMPTS = 3;
const READABLE_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']);

export function isBillReadingConfigured() {
  return azureConfig('AZURE_OPENAI_BILL_DEPLOYMENT') !== null;
}

export function canReadBill(mimeType: string) {
  return READABLE_TYPES.has(mimeType.toLowerCase());
}

const BILL_PROMPT = `You read receipts and invoices for a Canadian pharmacy business.
Return JSON only: {"date":"YYYY-MM-DD","amount":number,"gst":number|null,"pst":number|null,"vendor":string|null}
- date: the purchase or invoice date on the bill.
- amount: the final TOTAL paid, including taxes, as a positive number.
- gst: the GST/HST amount (lines marked GST, HST, "(G)" or "G"). null if not shown.
- pst: the PST/QST amount (lines marked PST, QST, "(P)" or "P"). null if not shown. Never copy the GST value into pst.
- vendor: the store or company name, or null.
If the image is not a bill, or the date or total cannot be read, return {"date":null,"amount":null,"gst":null,"pst":null,"vendor":null}.`;

type BillReading = { date: string; amount: number; gst: number | null; pst: number | null; vendor: string | null };

function toMoney(value: unknown) {
  const number = typeof value === 'number' ? value : typeof value === 'string' ? Number(value.replace(/[$,\s]/g, '')) : NaN;
  return Number.isFinite(number) ? Math.round(Math.abs(number) * 100) / 100 : null;
}

async function readBill(filePath: string, mimeType: string): Promise<BillReading | null> {
  const image = readFileSync(filePath).toString('base64');
  const parsed = await azureJsonChat([
    { role: 'system', content: BILL_PROMPT },
    { role: 'user', content: [
      { type: 'text', text: 'Read this bill.' },
      { type: 'image_url', image_url: { url: `data:${mimeType === 'image/jpg' ? 'image/jpeg' : mimeType};base64,${image}` } },
    ] },
  ], { deploymentEnv: 'AZURE_OPENAI_BILL_DEPLOYMENT', maxTokens: 2000, timeoutMs: 60_000 });
  const date = typeof parsed.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(parsed.date) ? parsed.date : null;
  const amount = toMoney(parsed.amount);
  if (!date || !amount) return null;
  const gst = toMoney(parsed.gst);
  let pst = toMoney(parsed.pst);
  // Guard against the model repeating GST as PST.
  if (pst !== null && gst !== null && pst === gst && pst > amount * 0.2) pst = null;
  return { date, amount, gst, pst, vendor: typeof parsed.vendor === 'string' && parsed.vendor.trim() ? parsed.vendor.trim().slice(0, 200) : null };
}

/** Read one bill with AI (if needed) and try to attach it. Never throws. */
export async function processBill(billId: string, uploadDirectory: string, options: { nightly?: boolean } = {}) {
  try {
    const found = await pool.query<{ file_path: string; mime_type: string; ai_status: string; ai_attempts: number; transaction_id: string | null }>(
      'SELECT file_path, mime_type, ai_status, ai_attempts, transaction_id FROM uploaded_bills WHERE id = $1', [billId]);
    const bill = found.rows[0];
    if (!bill || bill.transaction_id) return;
    if (bill.ai_status === 'done') { await matchBill(billId); return; }
    if (!canReadBill(bill.mime_type)) {
      await pool.query("UPDATE uploaded_bills SET ai_status = 'unsupported', ai_processed_at = NOW() WHERE id = $1", [billId]);
      return;
    }
    if (!isBillReadingConfigured()) return;
    // At upload a bill is tried a few times; the nightly run (like OATRx) tries every unread bill again.
    if (!options.nightly && bill.ai_attempts >= MAX_ATTEMPTS) return;
    const retryStatuses = options.nightly ? ['pending', 'failed', 'unreadable'] : ['pending', 'failed'];
    // Claim the bill so a timer run and an upload never read it twice.
    const claimed = await pool.query("UPDATE uploaded_bills SET ai_status = 'processing', ai_attempts = ai_attempts + 1 WHERE id = $1 AND ai_status = ANY($2::text[]) RETURNING id", [billId, retryStatuses]);
    if (!claimed.rowCount) return;
    try {
      const file = path.resolve(uploadDirectory, bill.file_path);
      // One quick retry for connection drops and rate limits before counting it as failed.
      const reading = await readBill(file, bill.mime_type).catch(async (error) => {
        const retryable = !(error instanceof AzureRequestError) || error.status === 429 || error.status >= 500;
        if (!retryable) throw error;
        await new Promise((resolve) => setTimeout(resolve, 3000));
        return readBill(file, bill.mime_type);
      });
      if (!reading) {
        await pool.query("UPDATE uploaded_bills SET ai_status = 'unreadable', ai_error = 'Date or total not found on the bill.', ai_processed_at = NOW() WHERE id = $1", [billId]);
        return;
      }
      await pool.query(
        `UPDATE uploaded_bills SET ai_status = 'done', ai_error = NULL, ai_processed_at = NOW(),
           bill_date = $2, bill_total = $3, bill_gst = $4, bill_pst = $5, bill_vendor = $6 WHERE id = $1`,
        [billId, reading.date, reading.amount, reading.gst, reading.pst, reading.vendor]);
      console.log(`[MediAccounts bills] read bill ${billId}: ${reading.date} $${reading.amount}${reading.vendor ? ` (${reading.vendor})` : ''}`);
      await matchBill(billId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI request failed';
      // Rate limits and timeouts are retried later; the attempt counter caps retries.
      await pool.query("UPDATE uploaded_bills SET ai_status = 'failed', ai_error = $2, ai_processed_at = NOW() WHERE id = $1", [billId, message.slice(0, 300)]);
      console.warn(`[MediAccounts bills] could not read bill ${billId}:`, message, error instanceof AzureRequestError ? `(status ${error.status})` : '');
    }
  } catch (error) {
    console.warn('[MediAccounts bills] processing error:', error instanceof Error ? error.message : error);
  }
}

type ReadBill = { id: string; bank_account_id: string | null; bill_date: string; bill_total: string; bill_gst: string | null; bill_pst: string | null; uploaded_by: string; file_name: string; file_size_bytes: number; file_path: string; mime_type: string };
const READ_BILL_COLUMNS = `id, bank_account_id, to_char(bill_date, 'YYYY-MM-DD') AS bill_date, bill_total, bill_gst, bill_pst, uploaded_by, file_name, file_size_bytes, file_path, mime_type`;

/** Link one read bill to one transaction (both must still be free). Returns false if either was taken. */
async function attachBill(bill: ReadBill, transactionId: string) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const updated = await client.query(
      `UPDATE transactions SET bill_status = 'attached', bill_name = $2, bill_size_bytes = $3, bill_file_path = $4, bill_mime_type = $5,
         bill_uploaded_by = $6, bill_mapped_by = 'ai', bill_mapped_at = NOW(),
         gst = COALESCE($7::numeric, gst),
         pst = COALESCE($8::numeric, pst),
         updated_at = NOW()
       WHERE id = $1 AND bill_status = 'missing' RETURNING id`,
      [transactionId, bill.file_name, bill.file_size_bytes, bill.file_path, bill.mime_type, bill.uploaded_by, bill.bill_gst, bill.bill_pst]);
    if (!updated.rowCount) { await client.query('ROLLBACK'); return false; }
    // OATRx deletes the waiting bill once its image is on the transaction.
    const linked = await client.query('DELETE FROM uploaded_bills WHERE id = $1 AND transaction_id IS NULL RETURNING id', [bill.id]);
    if (!linked.rowCount) { await client.query('ROLLBACK'); return false; }
    await client.query('COMMIT');
    console.log(`[MediAccounts bills] AI attached bill ${bill.id} to transaction ${transactionId}`);
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * OATRx ProcessSingleFinanceBill: attach a read bill to the first transaction of its bank
 * with the same date and amount (within 1 cent) that has no bill yet.
 */
export async function matchBill(billId: string) {
  const found = await pool.query<ReadBill>(
    `SELECT ${READ_BILL_COLUMNS} FROM uploaded_bills
     WHERE id = $1 AND ai_status = 'done' AND transaction_id IS NULL AND bank_account_id IS NOT NULL AND bill_date IS NOT NULL AND bill_total IS NOT NULL`, [billId]);
  const bill = found.rows[0];
  if (!bill) return null;
  const candidate = await pool.query<{ id: string }>(
    `SELECT id FROM transactions
     WHERE bank_account_id = $1 AND posted_on = $2 AND ABS(ABS(amount) - $3::numeric) < 0.01 AND bill_status = 'missing'
     ORDER BY created_at, id LIMIT 1`,
    [bill.bank_account_id, bill.bill_date, bill.bill_total]);
  if (!candidate.rowCount) return null;
  return (await attachBill(bill, candidate.rows[0].id)) ? candidate.rows[0].id : null;
}

/** Try every read-but-unmatched bill of a business, oldest first (nightly run). */
export async function matchBillsForBusiness(businessId: string) {
  const bills = await pool.query<{ id: string }>("SELECT id FROM uploaded_bills WHERE business_id = $1 AND ai_status = 'done' AND transaction_id IS NULL ORDER BY created_at", [businessId]);
  let matched = 0;
  for (const { id } of bills.rows) {
    if (await matchBill(id).catch(() => null)) matched++;
  }
  return matched;
}

/**
 * OATRx importExpenses: for each newly imported row, in file order, take the first read,
 * unmatched bill of the imported bank with the same date and amount. A used bill is not reused.
 */
export async function matchBillsForImport(bankAccountId: string | null, rows: Array<{ id: string; postedOn: string; amount: number }>) {
  if (!bankAccountId || !rows.length) return 0;
  const found = await pool.query<ReadBill>(
    `SELECT ${READ_BILL_COLUMNS} FROM uploaded_bills
     WHERE bank_account_id = $1 AND ai_status = 'done' AND transaction_id IS NULL AND bill_date IS NOT NULL AND bill_total IS NOT NULL
     ORDER BY created_at, id`, [bankAccountId]);
  const available = [...found.rows];
  let matched = 0;
  for (const row of rows) {
    if (!available.length) break;
    const index = available.findIndex((bill) => bill.bill_date === row.postedOn && Math.abs(Number(bill.bill_total) - Math.abs(row.amount)) < 0.01);
    if (index < 0) continue;
    const [bill] = available.splice(index, 1);
    if (await attachBill(bill, row.id).catch(() => false)) matched++;
  }
  return matched;
}

/** Read pending bills and retry matching. Runs on a timer; `businessId` limits it to one business. */
export async function processPendingBills(uploadDirectory: string, businessId?: string, options: { nightly?: boolean } = {}) {
  const nightly = !!options.nightly;
  const pending = await pool.query<{ id: string }>(
    `SELECT id FROM uploaded_bills
     WHERE transaction_id IS NULL AND ($1::uuid IS NULL OR business_id = $1)
       AND (ai_status = 'pending' OR (ai_status = 'failed' AND ($3 OR ai_attempts < $2))
            OR ($3 AND ai_status = 'unreadable')
            -- a crash can leave a bill claimed; retry it after 10 minutes
            OR (ai_status = 'processing' AND ai_processed_at IS NULL AND created_at < NOW() - INTERVAL '10 minutes'))
     ORDER BY created_at LIMIT $4`, [businessId ?? null, MAX_ATTEMPTS, nightly, nightly ? 500 : 50]);
  for (const { id } of pending.rows) {
    await pool.query("UPDATE uploaded_bills SET ai_status = 'failed' WHERE id = $1 AND ai_status = 'processing'", [id]);
    await processBill(id, uploadDirectory, { nightly });
    // Like OATRx, pause between AI requests in the nightly run to avoid rate limits.
    if (nightly) await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  const done = await pool.query<{ business_id: string }>("SELECT DISTINCT business_id FROM uploaded_bills WHERE ai_status = 'done' AND transaction_id IS NULL AND ($1::uuid IS NULL OR business_id = $1)", [businessId ?? null]);
  let matched = 0;
  for (const row of done.rows) matched += await matchBillsForBusiness(row.business_id);
  return { read: pending.rowCount ?? 0, matched };
}

let started = false;
/** Milliseconds until the next 23:55 (server local time). */
function msUntilNightlyRun(now = new Date()) {
  const next = new Date(now);
  next.setHours(23, 55, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next.getTime() - now.getTime();
}

/**
 * Background work: once at start (bills left unread by a restart), then every night at 23:55
 * like OATRx's finance:process-bills schedule.
 */
export function startBillWorker(uploadDirectory: string) {
  if (started) return;
  started = true;
  const log = (label: string) => (result: { read: number; matched: number }) => { if (result.read || result.matched) console.log(`[MediAccounts bills] ${label}:`, result); };
  const fail = (error: unknown) => console.warn('[MediAccounts bills] background run failed:', error instanceof Error ? error.message : error);
  setTimeout(() => processPendingBills(uploadDirectory).then(log('startup run')).catch(fail), 20_000);
  const scheduleNightly = () => setTimeout(() => {
    processPendingBills(uploadDirectory, undefined, { nightly: true }).then(log('nightly run')).catch(fail).finally(scheduleNightly);
  }, msUntilNightlyRun());
  scheduleNightly();
}
