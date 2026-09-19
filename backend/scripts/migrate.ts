import { closeDatabase, pool } from '../src/db.js';

const schema = `
  CREATE EXTENSION IF NOT EXISTS pgcrypto;
  CREATE TABLE IF NOT EXISTS app_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), email TEXT NOT NULL, name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'staff', 'accountant')),
    is_seed_admin BOOLEAN NOT NULL DEFAULT FALSE, is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE UNIQUE INDEX IF NOT EXISTS app_users_email_unique ON app_users (LOWER(email));
  ALTER TABLE app_users ADD COLUMN IF NOT EXISTS phone TEXT;
  CREATE TABLE IF NOT EXISTS businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  ALTER TABLE businesses ADD COLUMN IF NOT EXISTS alias_name TEXT;
  ALTER TABLE businesses ADD COLUMN IF NOT EXISTS business_address TEXT;
  ALTER TABLE businesses ADD COLUMN IF NOT EXISTS address_line2 TEXT;
  ALTER TABLE businesses ADD COLUMN IF NOT EXISTS city TEXT;
  ALTER TABLE businesses ADD COLUMN IF NOT EXISTS province TEXT;
  ALTER TABLE businesses ADD COLUMN IF NOT EXISTS postal_code TEXT;
  CREATE TABLE IF NOT EXISTS user_business_access (
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), PRIMARY KEY (user_id, business_id)
  );
  CREATE TABLE IF NOT EXISTS login_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    code_hash TEXT NOT NULL, expires_at TIMESTAMPTZ NOT NULL, consumed_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  ALTER TABLE login_codes ADD COLUMN IF NOT EXISTS failed_attempts INTEGER NOT NULL DEFAULT 0;
  CREATE INDEX IF NOT EXISTS login_codes_user_active_idx ON login_codes (user_id, expires_at) WHERE consumed_at IS NULL;
  CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE, expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions (user_id, expires_at);
  CREATE TABLE IF NOT EXISTS bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    masked_number TEXT NOT NULL,
    account_type TEXT NOT NULL DEFAULT 'bank',
    balance NUMERIC(14,2) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS bank_accounts_business_idx ON bank_accounts (business_id) WHERE is_active = TRUE;
  CREATE UNIQUE INDEX IF NOT EXISTS bank_accounts_business_name_unique ON bank_accounts (business_id, name, masked_number);
  ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS is_primary BOOLEAN NOT NULL DEFAULT FALSE;
  ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS card_type TEXT;
  CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
    posted_on DATE NOT NULL,
    merchant TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    amount NUMERIC(14,2) NOT NULL,
    category TEXT NOT NULL,
    gst NUMERIC(14,2) NOT NULL DEFAULT 0,
    pst NUMERIC(14,2) NOT NULL DEFAULT 0,
    memo TEXT NOT NULL DEFAULT '',
    bill_status TEXT NOT NULL DEFAULT 'missing' CHECK (bill_status IN ('missing', 'attached')),
    bill_name TEXT,
    bill_size_bytes INTEGER,
    bill_uploaded_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS transactions_business_date_idx ON transactions (business_id, posted_on DESC);
  ALTER TABLE transactions ADD COLUMN IF NOT EXISTS bill_file_path TEXT;
  ALTER TABLE transactions ADD COLUMN IF NOT EXISTS bill_mime_type TEXT;
  CREATE TABLE IF NOT EXISTS uploaded_bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
    transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    file_name TEXT NOT NULL, file_size_bytes INTEGER NOT NULL, file_path TEXT NOT NULL,
    mime_type TEXT NOT NULL, uploaded_by UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  ALTER TABLE uploaded_bills ADD COLUMN IF NOT EXISTS transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL;
  CREATE INDEX IF NOT EXISTS uploaded_bills_business_idx ON uploaded_bills (business_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS uploaded_bills_unmatched_idx ON uploaded_bills (business_id, bank_account_id, created_at DESC) WHERE transaction_id IS NULL;
  CREATE TABLE IF NOT EXISTS bank_export_details (
    bank_account_id UUID PRIMARY KEY REFERENCES bank_accounts(id) ON DELETE CASCADE,
    institution_number TEXT, transit_number TEXT, account_number_encrypted TEXT, account_number_last4 TEXT,
    micr_routing_number TEXT, last_cheque_number TEXT,
    bank_address TEXT, bank_address_line2 TEXT, bank_city TEXT, bank_province TEXT, bank_postal_code TEXT,
    cheque_image_path TEXT, cheque_image_name TEXT, cheque_image_mime TEXT,
    updated_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  -- Companies exported from Accounting > Business into BookKeeper (cheque printing), same as OATRx paycheck companies.
  CREATE TABLE IF NOT EXISTS bookkeeper_companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
    bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
    name TEXT NOT NULL, alias_name TEXT, address TEXT, address_line2 TEXT, city TEXT, province TEXT, postal_code TEXT,
    bank_name TEXT NOT NULL, account_type TEXT,
    institution_number TEXT, transit_number TEXT, account_number_encrypted TEXT, account_number_last4 TEXT,
    micr_routing_number TEXT, last_cheque_number TEXT,
    credit_card_encrypted TEXT, credit_card_last4 TEXT, card_type TEXT,
    bank_address TEXT, bank_address_line2 TEXT, bank_city TEXT, bank_province TEXT, bank_postal_code TEXT,
    bg_image_path TEXT, bg_image_name TEXT, bg_image_mime TEXT,
    status BOOLEAN NOT NULL DEFAULT TRUE, is_imported BOOLEAN NOT NULL DEFAULT TRUE, added_by_type TEXT NOT NULL DEFAULT 'Finance',
    added_by UUID REFERENCES app_users(id) ON DELETE SET NULL, added_by_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE UNIQUE INDEX IF NOT EXISTS bookkeeper_companies_name_key ON bookkeeper_companies (LOWER(name));
  -- Learned transaction categories. business_id NULL = shared rule (from AI); otherwise a business's own rule.
  CREATE TABLE IF NOT EXISTS category_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    normalized_key TEXT NOT NULL,
    category TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'ai' CHECK (source IN ('ai', 'user')),
    example TEXT,
    usage_count INTEGER NOT NULL DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE UNIQUE INDEX IF NOT EXISTS category_rules_shared_key ON category_rules (normalized_key) WHERE business_id IS NULL;
  CREATE UNIQUE INDEX IF NOT EXISTS category_rules_business_key ON category_rules (business_id, normalized_key) WHERE business_id IS NOT NULL;
  CREATE INDEX IF NOT EXISTS transactions_import_lookup ON transactions (business_id, bank_account_id, posted_on);
  -- Bill reading (AI) and who/what attached a bill to a transaction.
  ALTER TABLE uploaded_bills ADD COLUMN IF NOT EXISTS ai_status TEXT NOT NULL DEFAULT 'pending';
  ALTER TABLE uploaded_bills ADD COLUMN IF NOT EXISTS ai_attempts INTEGER NOT NULL DEFAULT 0;
  ALTER TABLE uploaded_bills ADD COLUMN IF NOT EXISTS ai_error TEXT;
  ALTER TABLE uploaded_bills ADD COLUMN IF NOT EXISTS ai_processed_at TIMESTAMPTZ;
  ALTER TABLE uploaded_bills ADD COLUMN IF NOT EXISTS bill_date DATE;
  ALTER TABLE uploaded_bills ADD COLUMN IF NOT EXISTS bill_total NUMERIC(14,2);
  ALTER TABLE uploaded_bills ADD COLUMN IF NOT EXISTS bill_gst NUMERIC(14,2);
  ALTER TABLE uploaded_bills ADD COLUMN IF NOT EXISTS bill_pst NUMERIC(14,2);
  ALTER TABLE uploaded_bills ADD COLUMN IF NOT EXISTS bill_vendor TEXT;
  -- Bills already attached before AI reading existed are never read.
  UPDATE uploaded_bills SET ai_status = 'skipped' WHERE transaction_id IS NOT NULL AND ai_status = 'pending';
  CREATE INDEX IF NOT EXISTS uploaded_bills_ai_idx ON uploaded_bills (ai_status, business_id) WHERE transaction_id IS NULL;
  ALTER TABLE transactions ADD COLUMN IF NOT EXISTS bill_mapped_by TEXT;
  ALTER TABLE transactions ADD COLUMN IF NOT EXISTS bill_mapped_at TIMESTAMPTZ;
  -- Categories typed in by users (the standard list lives in code), shared like OATRx finance_categories.
  CREATE TABLE IF NOT EXISTS transaction_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE UNIQUE INDEX IF NOT EXISTS transaction_categories_name_key ON transaction_categories (LOWER(name));
  -- Assign older shared rules to the business whose transactions they came from; drop any left unmatched.
  INSERT INTO category_rules (business_id, normalized_key, category, source, example, usage_count, last_used_at, created_at)
  SELECT DISTINCT ON (t.business_id, r.normalized_key) t.business_id, r.normalized_key, r.category, r.source, r.example, r.usage_count, r.last_used_at, r.created_at
  FROM category_rules r
  JOIN transactions t ON r.example IS NOT NULL AND (t.merchant = r.example OR t.merchant || ' ' || t.description = r.example)
  WHERE r.business_id IS NULL
  ON CONFLICT (business_id, normalized_key) WHERE business_id IS NOT NULL DO NOTHING;
  DELETE FROM category_rules WHERE business_id IS NULL;
  -- Optional business logo and user profile photo (files live in uploads/).
  -- OATRx keeps no bill row once it is attached; the image lives on the transaction.
  DELETE FROM uploaded_bills WHERE transaction_id IS NOT NULL;
  -- Category rules are shared by every business (OATRx finance_category_rules).
  -- Keep the most used rule per description and drop the per-business copies.
  INSERT INTO category_rules (business_id, normalized_key, category, source, example, usage_count, last_used_at, created_at)
  SELECT DISTINCT ON (normalized_key) NULL, normalized_key, category, source, example, usage_count, last_used_at, created_at
  FROM category_rules WHERE business_id IS NOT NULL
  ORDER BY normalized_key, usage_count DESC, created_at
  ON CONFLICT (normalized_key) WHERE business_id IS NULL DO NOTHING;
  DELETE FROM category_rules WHERE business_id IS NOT NULL;
  ALTER TABLE businesses ADD COLUMN IF NOT EXISTS logo_path TEXT;
  ALTER TABLE businesses ADD COLUMN IF NOT EXISTS logo_mime TEXT;
  ALTER TABLE businesses ADD COLUMN IF NOT EXISTS logo_updated_at TIMESTAMPTZ;
  ALTER TABLE app_users ADD COLUMN IF NOT EXISTS avatar_path TEXT;
  ALTER TABLE app_users ADD COLUMN IF NOT EXISTS avatar_mime TEXT;
  ALTER TABLE app_users ADD COLUMN IF NOT EXISTS avatar_updated_at TIMESTAMPTZ;
`;

pool.query(schema)
  .then(() => console.log('MediAccounts database schema is ready.'))
  .catch((error) => { console.error('Migration failed:', error instanceof Error ? error.message : error); process.exitCode = 1; })
  .finally(closeDatabase);
