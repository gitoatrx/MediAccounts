// Transaction categorization for CSV imports.
// Order: fixed rules → this business's learned rules → Azure OpenAI → keywords.
// Mirrors the OATRx finance import, but every learned rule belongs to the business
// the CSV was uploaded for, and a user's correction replaces the AI's choice.
import { azureConfig, azureJsonChat } from './azureOpenAi.js';
import { pool } from './db.js';

export const STANDARD_CATEGORIES = [
  // Income
  'Sales', 'Service Income', 'Product Sales', 'Consulting Income', 'Professional Fees', 'Commission Income',
  'Interest Income', 'Other Income', 'Discounts Given', 'Refunds & Rebates',
  // Cost of goods sold
  'Cost of Sales', 'Materials & Supplies (Direct)', 'Purchases', 'Subcontracted Services', 'Direct Labor', 'Freight & Shipping',
  // Expenses
  'Advertising & Marketing', 'Bank Charges', 'Office Supplies', 'Printing & Stationery', 'Postage & Delivery',
  'Repairs & Maintenance', 'Dues & Subscriptions', 'Software & Subscriptions', 'Internet', 'Telephone', 'Utilities',
  'Legal & Professional Fees', 'Accounting Fees', 'Consulting', 'Business Licenses & Permits', 'Insurance', 'Lease', 'Rent',
  'Salaries & Wages', 'Payroll Taxes', 'Employee Benefits', 'Training & Education', 'Recruitment', 'Travel', 'Airfare',
  'Lodging', 'Meals & Entertainment', 'Vehicle Fuel', 'Vehicle Maintenance', 'Parking & Tolls', 'Mileage', 'Customer Gifts',
  'Bad Debts', 'Sales Commissions', 'Payment Processing Fees', 'Medical Supplies', 'Cleaning & Janitorial', 'Security',
  'Waste Disposal', 'Property Tax', 'Tax Expense', 'Equipment Rental', 'Loan Interest', 'Inventory', 'Leasehold Improvements',
  // System
  'Transfer', 'Cheque', 'Western Union', 'Owner Contribution', 'Owner Draw', 'Loan Principal Payment', 'Uncategorized',
];
const STANDARD_BY_LOWER = new Map(STANDARD_CATEGORIES.map((name) => [name.toLowerCase(), name]));


export type CategorySource = 'csv' | 'fixed' | 'user-rule' | 'rule' | 'ai' | 'keyword';

/** Lowercase, drop digits/dates/card masks, collapse punctuation. Used as the rule key. */
export function normalizeDescription(text: string) {
  return text.toLowerCase()
    .replace(/\*+/g, ' ')
    .replace(/\d{1,4}[/-]\d{1,2}[/-]\d{1,4}/g, ' ')
    .replace(/\d+/g, ' ')
    .replace(/[^a-z]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 255);
}

// Merchant rules that always win over generic "transfer / pre-auth debit" wording (same as OATRx).
const FIXED_RULES: Array<[RegExp, string]> = [
  [/west(ern)? union/, 'Western Union'],
  [/rent\s*\/\s*lease|\bleas(e|ing|eco)\b|c\.?\s?c\.? leasing/, 'Lease'],
  [/mckesson|imperial distributors/, 'Purchases'],
  [/fortisbc|fortis bc/, 'Utilities'],
  [/moneris|royal bank central card centre|\b(mc|vsa|int|mon) fee\b/, 'Payment Processing Fees'],
];

export function fixedCategory(text: string) {
  const value = text.toLowerCase();
  return FIXED_RULES.find(([pattern]) => pattern.test(value))?.[1] ?? null;
}

/** Offline fallback when there is no rule and AI is unavailable. */
export function keywordCategory(text: string) {
  const value = text.toLowerCase();
  if (/insurance/.test(value)) return 'Insurance';
  if (/paypal/.test(value)) return /fee/.test(value) ? 'Payment Processing Fees' : 'Transfer';
  if (/fitness|gym|membership|subscription|recurring/.test(value)) return 'Dues & Subscriptions';
  if (/loan|mortgage|toyota finance|vehicle finance/.test(value)) return 'Loan Principal Payment';
  if (/account(?:ing)? fee|service fee|bank charge|monthly fee|overdraft|\bnsf\b/.test(value)) return 'Bank Charges';
  if (/\bcheque\b|\bcheck\b|\bchq\b/.test(value)) return 'Cheque';
  if (/bookkeep|accountant|tax prep/.test(value)) return 'Accounting Fees';
  if (/\brent\b/.test(value)) return 'Rent';
  if (/hydro|utility|utilities|electric|gas bill|enbridge/.test(value)) return 'Utilities';
  if (/\b(telus|rogers|bell|shaw|fido|koodo)\b|freedom mobile/.test(value)) return 'Telephone';
  if (/\b(payroll|salary|wages)\b/.test(value)) return 'Salaries & Wages';
  if (/\bcra\b|receiver general|\b(gst|hst|tax)\b/.test(value)) return 'Tax Expense';
  if (/petro|\b(esso|shell|chevron|husky|fuel)\b/.test(value)) return 'Vehicle Fuel';
  if (/parking|impark|\btolls?\b/.test(value)) return 'Parking & Tolls';
  if (/restaurant|tim hortons|starbucks|mcdonald|\b(cafe|coffee|pizza)\b/.test(value)) return 'Meals & Entertainment';
  if (/staples|office|stationery/.test(value)) return 'Office Supplies';
  if (/supply|supplies/.test(value)) return 'Medical Supplies';
  if (/inventory|wholesale|packaging/.test(value)) return 'Inventory';
  if (/transfer|e-?transfer|internet banking|pre-?auth debit/.test(value)) return 'Transfer';
  return 'Uncategorized';
}

export function isAiCategorizationConfigured() {
  return azureConfig() !== null;
}

const SYSTEM_PROMPT = `You categorize bank transactions for a pharmacy business in Canada.
Choose exactly ONE category per transaction from the STANDARD list. Be conservative and literal: use only the text given, never guess hidden purposes.
Generic payment wording (Electronic Funds Transfer, E-Transfer, Internet Banking, Pre-Auth Debit, POS, Interac, Purchase, Debit) must not decide the category when a merchant or keyword points to something more specific.
Fixed mappings: WESTERN UNION => "Western Union"; LEASE/LEASING/RENT/LEASE/CC Leasing/Leaseco => "Lease"; MCKESSON or IMPERIAL DISTRIBUTORS => "Purchases"; FORTISBC => "Utilities"; MONERIS, ROYAL BANK CENTRAL CARD CENTRE, MC FEE, VSA FEE, INT FEE, MON FEE => "Payment Processing Fees"; PAYPAL => "Payment Processing Fees" if it is a fee, otherwise "Transfer".
Insurance-related => "Insurance". A cheque with no visible payee => "Cheque". A transfer with unclear purpose => "Transfer". If nothing fits, use "Uncategorized".
Reply with JSON only: {"results":[{"i":<number>,"category":"<STANDARD category>"}]} with one entry for every transaction number.`;

async function askAzure(items: Array<{ i: number; text: string; amount: number }>) {
  if (!items.length) return new Map<number, string>();
  const parsed = await azureJsonChat([
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: `STANDARD categories: ${STANDARD_CATEGORIES.join(', ')}\n\nTransactions:\n${items.map((item) => `${item.i}. ${item.text} | amount ${item.amount.toFixed(2)}`).join('\n')}` },
  ], { deploymentEnv: 'AZURE_OPENAI_CATEGORY_DEPLOYMENT' }) as { results?: Array<{ i?: unknown; category?: unknown }> };
  const result = new Map<number, string>();
  for (const entry of parsed.results ?? []) {
    const category = typeof entry.category === 'string' ? STANDARD_BY_LOWER.get(entry.category.trim().toLowerCase()) : undefined;
    // Ignore anything outside the standard list or the numbers we sent.
    if (typeof entry.i === 'number' && category && category !== 'Uncategorized') result.set(entry.i, category);
  }
  return result;
}

type Input = { text: string; amount: number; supplied?: string };
export type Categorized = { category: string; source: CategorySource; key: string };

/**
 * Categorize a batch of imported rows. Each distinct description is looked up once,
 * and only descriptions without a fixed or learned rule are sent to AI.
 */
export async function categorizeTransactions(businessId: string, inputs: Input[]) {
  const results: Categorized[] = new Array(inputs.length);
  const keys = inputs.map((input) => normalizeDescription(input.text));
  const pending = new Map<string, number[]>();
  inputs.forEach((input, index) => {
    const key = keys[index];
    const supplied = input.supplied?.trim();
    if (supplied) { results[index] = { category: STANDARD_BY_LOWER.get(supplied.toLowerCase()) ?? supplied, source: 'csv', key }; return; }
    const fixed = fixedCategory(input.text);
    if (fixed) { results[index] = { category: fixed, source: 'fixed', key }; return; }
    if (!key) { results[index] = { category: keywordCategory(input.text), source: 'keyword', key }; return; }
    pending.set(key, [...(pending.get(key) ?? []), index]);
  });

  // Learned rules for the selected business only (AI results and user corrections).
  const learned = new Map<string, { category: string; source: CategorySource }>();
  if (pending.size) {
    const rows = await pool.query<{ normalized_key: string; category: string; source: string }>(
      `SELECT normalized_key, category, source FROM category_rules WHERE business_id IS NULL AND normalized_key = ANY($1)`,
      [[...pending.keys()]],
    );
    for (const row of rows.rows) {
      if (!learned.has(row.normalized_key)) learned.set(row.normalized_key, { category: row.category, source: row.source === 'user' ? 'user-rule' : 'rule' });
    }
  }
  const usedRuleKeys: string[] = [];
  for (const [key, indexes] of [...pending]) {
    const rule = learned.get(key);
    if (!rule) continue;
    usedRuleKeys.push(key);
    indexes.forEach((index) => { results[index] = { category: rule.category, source: rule.source, key }; });
    pending.delete(key);
  }
  if (usedRuleKeys.length) {
    await pool.query(`UPDATE category_rules SET usage_count = usage_count + 1, last_used_at = NOW() WHERE business_id IS NULL AND normalized_key = ANY($1)`, [usedRuleKeys]);
  }

  // Azure OpenAI for the remaining distinct descriptions, in parallel batches.
  let aiError: string | null = null;
  const aiCategories = new Map<string, string>();
  if (pending.size && isAiCategorizationConfigured()) {
    const unique = [...pending.entries()].map(([key, indexes], position) => ({ key, i: position + 1, text: inputs[indexes[0]].text, amount: inputs[indexes[0]].amount }));
    const batches: typeof unique[] = [];
    for (let start = 0; start < unique.length; start += 40) batches.push(unique.slice(start, start + 40));
    for (let start = 0; start < batches.length; start += 3) {
      const settled = await Promise.allSettled(batches.slice(start, start + 3).map((batch) => askAzure(batch)));
      settled.forEach((outcome, offset) => {
        if (outcome.status === 'rejected') { aiError = outcome.reason instanceof Error ? outcome.reason.message : 'AI request failed'; return; }
        for (const item of batches[start + offset]) {
          const category = outcome.value.get(item.i);
          if (category) aiCategories.set(item.key, category);
        }
      });
    }
    if (aiError) console.warn('[MediAccounts categorize] Azure OpenAI failed for some rows; using keywords:', aiError);
    if (aiCategories.size) {
      // Like OATRx, rules are shared by every business.
      await pool.query(
        `INSERT INTO category_rules (business_id, normalized_key, category, source, example)
         SELECT NULL, key, category, 'ai', example FROM UNNEST($1::text[], $2::text[], $3::text[]) AS t(key, category, example)
         ON CONFLICT (normalized_key) WHERE business_id IS NULL DO NOTHING`,
        [[...aiCategories.keys()], [...aiCategories.values()], [...aiCategories.keys()].map((key) => inputs[pending.get(key)![0]].text.slice(0, 255))],
      );
    }
  }
  for (const [key, indexes] of pending) {
    const ai = aiCategories.get(key);
    indexes.forEach((index) => { results[index] = ai ? { category: ai, source: 'ai', key } : { category: keywordCategory(inputs[index].text), source: 'keyword', key }; });
  }
  return { results, aiConfigured: isAiCategorizationConfigured(), aiError };
}

