import pg from 'pg';

const { Pool } = pg;

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: pg.Pool | undefined;
}

function getPool(): pg.Pool {
  if (globalThis._pgPool) return globalThis._pgPool;

  const isProd = process.env.NODE_ENV === 'production';
  globalThis._pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: isProd ? 10 : 5,
    ssl: process.env.DATABASE_URL?.includes('localhost')
      ? undefined
      : { rejectUnauthorized: false },
  });

  return globalThis._pgPool;
}

export const pool = getPool();
