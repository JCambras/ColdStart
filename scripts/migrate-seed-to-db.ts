/**
 * Migrates hardcoded seed data (nearby places, streaming, facility details)
 * from seedData.ts and JSON files into database tables.
 *
 * Run: npx tsx scripts/migrate-seed-to-db.ts
 */
import pg from 'pg';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, basename } from 'path';

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  const client = await pool.connect();
  try {
    // Ensure tables exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS nearby_places (
        id SERIAL PRIMARY KEY,
        rink_id TEXT NOT NULL REFERENCES rinks(id),
        category TEXT NOT NULL,
        name TEXT NOT NULL,
        distance TEXT,
        url TEXT,
        is_partner BOOLEAN NOT NULL DEFAULT FALSE,
        partner_note TEXT,
        is_far BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS venue_metadata (
        id SERIAL PRIMARY KEY,
        rink_id TEXT NOT NULL REFERENCES rinks(id) UNIQUE,
        streaming_type TEXT,
        streaming_url TEXT,
        facility_details JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_nearby_places_rink ON nearby_places(rink_id);
      CREATE INDEX IF NOT EXISTS idx_nearby_places_rink_cat ON nearby_places(rink_id, category);
      CREATE INDEX IF NOT EXISTS idx_venue_metadata_rink ON venue_metadata(rink_id);
    `);

    // Load nearby places from JSON files in public/data/nearby/
    const nearbyDir = join(process.cwd(), 'public', 'data', 'nearby');
    if (existsSync(nearbyDir)) {
      const files = readdirSync(nearbyDir).filter(f => f.endsWith('.json'));
      console.log(`Found ${files.length} nearby data files`);

      for (const file of files) {
        const rinkId = basename(file, '.json');
        // Verify rink exists
        const rinkCheck = await client.query('SELECT id FROM rinks WHERE id = $1', [rinkId]);
        if (rinkCheck.rows.length === 0) {
          console.log(`  Skipping ${rinkId} (not in rinks table)`);
          continue;
        }

        const data = JSON.parse(readFileSync(join(nearbyDir, file), 'utf-8'));
        let count = 0;

        for (const [category, places] of Object.entries(data)) {
          if (!Array.isArray(places)) continue;
          for (const place of places as Array<Record<string, unknown>>) {
            await client.query(
              `INSERT INTO nearby_places (rink_id, category, name, distance, url, is_partner, partner_note, is_far)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
               ON CONFLICT DO NOTHING`,
              [
                rinkId,
                category,
                place.name as string,
                (place.distance as string) || null,
                (place.url as string) || null,
                !!(place.isPartner),
                (place.partnerNote as string) || null,
                !!(place.isFar),
              ]
            );
            count++;
          }
        }
        console.log(`  Loaded ${count} places for ${rinkId}`);
      }
    }

    console.log('Seed data migration complete.');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
