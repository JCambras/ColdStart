import pg from 'pg';

const { Pool } = pg;

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: pg.Pool | undefined;
}

function getPool(): pg.Pool {
  if (process.env.NODE_ENV === 'production') {
    return new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      ssl: { rejectUnauthorized: false },
    });
  }

  // Dev: reuse across hot-reloads
  if (!globalThis._pgPool) {
    globalThis._pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
      ssl: { rejectUnauthorized: false },
    });
  }
  return globalThis._pgPool;
}

export const pool = getPool();
