#!/usr/bin/env node
/**
 * Trip schedules database migration.
 * Creates trip_schedules table for pre/post-game push notifications.
 *
 * Usage: node scripts/migrate-trips.mjs
 */

import pg from 'pg';
import { readFileSync } from 'fs';

// Parse .env.local without requiring dotenv
const envFile = readFileSync('.env.local', 'utf8');
for (const line of envFile.split('\n')) {
  const match = line.match(/^\s*([\w]+)\s*=\s*(.*)\s*$/);
  if (match && !process.env[match[1]]) {
    process.env[match[1]] = match[2];
  }
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const sql = `
CREATE TABLE IF NOT EXISTS trip_schedules (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rink_id TEXT NOT NULL,
  rink_name TEXT NOT NULL,
  trip_id TEXT NOT NULL,
  team_name TEXT NOT NULL,
  opponent TEXT,
  game_time TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_trip_sched_game_time ON trip_schedules(game_time);
CREATE INDEX IF NOT EXISTS idx_trip_sched_user ON trip_schedules(user_id);
`;

try {
  await pool.query(sql);
  console.log('Trip schedule tables created successfully.');
} catch (err) {
  console.error('Migration failed:', err);
  process.exit(1);
} finally {
  await pool.end();
}
