import pg from 'pg';

const { Pool } = pg;

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: pg.Pool | undefined;
}

function getPool(): pg.Pool {
  if (globalThis._pgPool) return globalThis._pgPool;

  const dbUrl = process.env.DATABASE_URL;

  globalThis._pgPool = new Pool({
    connectionString: dbUrl || undefined,
    max: 5,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: dbUrl ? 2_000 : 100,
    ssl: dbUrl && !dbUrl.includes('localhost')
      ? { rejectUnauthorized: false }
      : undefined,
  });

  globalThis._pgPool.on('error', (err) => {
    console.error('[db] Unexpected pool error:', err.message);
  });

  return globalThis._pgPool;
}

export const pool = getPool();
