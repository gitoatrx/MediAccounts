import dotenv from 'dotenv';
import { closeDatabase, pool } from '../src/db.js';
import { normalizeEmail } from '../src/security.js';

dotenv.config();

async function seed() {
  const name = process.env.SEED_ADMIN_NAME?.trim();
  const email = process.env.SEED_ADMIN_EMAIL?.trim();
  if (!name || !email) throw new Error('Set SEED_ADMIN_NAME and SEED_ADMIN_EMAIL in .env before running npm run seed.');

  await pool.query('BEGIN');
  try {
    const normalizedEmail = normalizeEmail(email);
    await pool.query(`INSERT INTO app_users (email, name, role, is_seed_admin, is_active) VALUES ($1, $2, 'admin', TRUE, TRUE) ON CONFLICT DO NOTHING`, [normalizedEmail, name]);
    const user = await pool.query<{ id: string }>(`UPDATE app_users SET name = $2, role = 'admin', is_seed_admin = TRUE, is_active = TRUE, updated_at = NOW() WHERE LOWER(email) = LOWER($1) RETURNING id`, [normalizedEmail, name]);
    const userId = user.rows[0]?.id;
    if (!userId) throw new Error('Could not create the seed administrator.');
    await pool.query('COMMIT');
    console.log(`Seed admin ${normalizedEmail} is ready. Create businesses and data in the app.`);
  } catch (error) {
    await pool.query('ROLLBACK');
    throw error;
  }
}

seed().catch((error) => { console.error('Seed failed:', error instanceof Error ? error.message : error); process.exitCode = 1; }).finally(closeDatabase);
