import dotenv from 'dotenv';
import { closeDatabase, pool } from '../src/db.js';

dotenv.config();

async function resetToSeed() {
  await pool.query('BEGIN');
  try {
    await pool.query('DELETE FROM sessions');
    await pool.query('DELETE FROM login_codes');
    await pool.query('DELETE FROM transactions');
    await pool.query('DELETE FROM bank_accounts');
    await pool.query('DELETE FROM user_business_access');
    await pool.query('DELETE FROM businesses');
    await pool.query('DELETE FROM app_users WHERE is_seed_admin = FALSE');
    await pool.query('COMMIT');
    console.log('Removed demo data. Only the seed admin user remains.');
  } catch (error) {
    await pool.query('ROLLBACK');
    throw error;
  }
}

resetToSeed().catch((error) => { console.error(error); process.exitCode = 1; }).finally(closeDatabase);
