import pg from 'pg';

const { Pool } = pg;

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: pg.Pool | undefined;
}

function getPool(): pg.Pool {
  if (globalThis._pgPool) return globalThis._pgPool;

  globalThis._pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
    ssl: process.env.DATABASE_URL?.includes('localhost')
      ? undefined
      : { rejectUnauthorized: false },
  });

  globalThis._pgPool.on('error', (err) => {
    console.error('[db] Unexpected pool error:', err.message);
  });

  return globalThis._pgPool;
}

export const pool = getPool();
