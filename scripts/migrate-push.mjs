#!/usr/bin/env node
/**
 * Push notifications database migration.
 * Creates push_subscriptions and notification_log tables.
 *
 * Usage: node scripts/migrate-push.mjs
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
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  watched_rink_ids TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_push_subs_user ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subs_watched ON push_subscriptions USING GIN (watched_rink_ids);

CREATE TABLE IF NOT EXISTS notification_log (
  id SERIAL PRIMARY KEY,
  subscription_id INTEGER NOT NULL REFERENCES push_subscriptions(id) ON DELETE CASCADE,
  rink_id TEXT,
  event_type TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notif_log_sub_rink ON notification_log(subscription_id, rink_id, sent_at);
`;

try {
  await pool.query(sql);
  console.log('Push notification tables created successfully.');
} catch (err) {
  console.error('Migration failed:', err);
  process.exit(1);
} finally {
  await pool.end();
}
