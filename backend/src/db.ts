import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required. Copy .env.example to .env and configure PostgreSQL.');
}

export const pool = new Pool({ connectionString: databaseUrl });

export async function closeDatabase() {
  await pool.end();
}
