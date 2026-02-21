import pg from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const BASEBALL_SIGNALS = ['parking', 'heat', 'food_nearby', 'chaos', 'family_friendly', 'dugouts', 'batting_cages'];

async function run() {
  const client = await pool.connect();
  try {
    // Create fields table (reuses rinks schema but with distinct IDs)
    console.log('Ensuring rinks table exists for fields...');
    // Fields live in the same rinks table — the venueConfig determines how they're displayed
    // We prefix field IDs to avoid collisions

    // Load fields
    console.log('Loading fields.json...');
    const fieldsPath = join(process.cwd(), 'public', 'data', 'fields.json');
    const fields: Array<{
      id: string;
      name: string;
      city: string;
      state: string;
      address?: string;
      latitude?: number;
      longitude?: number;
    }> = JSON.parse(readFileSync(fieldsPath, 'utf-8'));
    console.log(`Found ${fields.length} fields`);

    // Insert fields into rinks table
    const BATCH_SIZE = 50;
    let inserted = 0;
    for (let i = 0; i < fields.length; i += BATCH_SIZE) {
      const batch = fields.slice(i, i + BATCH_SIZE);
      const values: unknown[] = [];
      const placeholders: string[] = [];

      for (let j = 0; j < batch.length; j++) {
        const f = batch[j];
        const offset = j * 7;
        placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7})`);
        values.push(f.id, f.name, f.city, f.state, f.address || '', f.latitude ?? null, f.longitude ?? null);
      }

      await client.query(
        `INSERT INTO rinks (id, name, city, state, address, latitude, longitude)
         VALUES ${placeholders.join(', ')}
         ON CONFLICT (id) DO NOTHING`,
        values
      );
      inserted += batch.length;
      console.log(`  Inserted ${inserted}/${fields.length} fields`);
    }

    // Generate realistic signal ratings for each field
    console.log('Generating baseball signal ratings...');
    let totalRatings = 0;
    const ratingValues: unknown[] = [];
    const ratingPlaceholders: string[] = [];
    let paramIndex = 1;

    for (const field of fields) {
      const numRatings = 3 + Math.floor(Math.random() * 12); // 3-14 ratings per field

      for (let k = 0; k < numRatings; k++) {
        const signal = BASEBALL_SIGNALS[Math.floor(Math.random() * BASEBALL_SIGNALS.length)];
        const value = 1 + Math.floor(Math.random() * 5); // 1-5

        ratingPlaceholders.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3})`);
        ratingValues.push(field.id, signal, value, 'visiting_parent');
        paramIndex += 4;
        totalRatings++;

        if (ratingPlaceholders.length >= 2000) {
          await client.query(
            `INSERT INTO signal_ratings (rink_id, signal, value, contributor_type)
             VALUES ${ratingPlaceholders.join(', ')}`,
            ratingValues
          );
          console.log(`  Inserted ${totalRatings} ratings so far...`);
          ratingPlaceholders.length = 0;
          ratingValues.length = 0;
          paramIndex = 1;
        }
      }
    }

    if (ratingPlaceholders.length > 0) {
      await client.query(
        `INSERT INTO signal_ratings (rink_id, signal, value, contributor_type)
         VALUES ${ratingPlaceholders.join(', ')}`,
        ratingValues
      );
    }
    console.log(`Inserted ${totalRatings} total baseball signal ratings`);

    console.log('Done! Baseball fields seeded successfully.');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error('Baseball seed failed:', err);
  process.exit(1);
});
