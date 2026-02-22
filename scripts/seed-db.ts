import pg from 'pg';
import { readFileSync, existsSync } from 'fs';
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

async function run() {
  const client = await pool.connect();
  try {
    console.log('Creating tables...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS rinks (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        city TEXT NOT NULL,
        state CHAR(2) NOT NULL,
        address TEXT NOT NULL DEFAULT '',
        latitude DOUBLE PRECISION,
        longitude DOUBLE PRECISION,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS signal_ratings (
        id SERIAL PRIMARY KEY,
        rink_id TEXT NOT NULL REFERENCES rinks(id),
        signal TEXT NOT NULL,
        value INTEGER NOT NULL CHECK (value BETWEEN 1 AND 5),
        contributor_type TEXT NOT NULL DEFAULT 'visiting_parent',
        user_id TEXT,
        context TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS tips (
        id SERIAL PRIMARY KEY,
        rink_id TEXT NOT NULL REFERENCES rinks(id),
        text TEXT NOT NULL,
        contributor_type TEXT NOT NULL DEFAULT 'visiting_parent',
        user_id TEXT,
        context TEXT,
        hidden BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS tip_flags (
        id SERIAL PRIMARY KEY,
        tip_id INTEGER NOT NULL REFERENCES tips(id),
        reason TEXT,
        reporter_id TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS home_teams (
        id SERIAL PRIMARY KEY,
        rink_id TEXT NOT NULL REFERENCES rinks(id),
        team_name TEXT NOT NULL,
        category TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS referral_visits (
        id SERIAL PRIMARY KEY,
        rink_id TEXT,
        source TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS rink_photos (
        id SERIAL PRIMARY KEY,
        rink_id TEXT NOT NULL REFERENCES rinks(id),
        url TEXT NOT NULL,
        user_id TEXT,
        caption TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS rink_claims (
        id SERIAL PRIMARY KEY,
        rink_id TEXT NOT NULL REFERENCES rinks(id),
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        role TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS operator_responses (
        id SERIAL PRIMARY KEY,
        tip_id INTEGER REFERENCES tips(id),
        rink_id TEXT,
        responder_name TEXT NOT NULL,
        responder_role TEXT,
        text TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

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
    `);

    console.log('Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_rinks_state ON rinks(state);
      CREATE INDEX IF NOT EXISTS idx_rinks_name_lower ON rinks(lower(name));
      CREATE INDEX IF NOT EXISTS idx_signal_ratings_rink ON signal_ratings(rink_id);
      CREATE INDEX IF NOT EXISTS idx_signal_ratings_rink_signal ON signal_ratings(rink_id, signal);
      CREATE INDEX IF NOT EXISTS idx_signal_ratings_user ON signal_ratings(user_id);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_signal_ratings_user_unique ON signal_ratings(rink_id, signal, user_id) WHERE user_id IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_tips_rink ON tips(rink_id);
      CREATE INDEX IF NOT EXISTS idx_tips_user ON tips(user_id);
      CREATE INDEX IF NOT EXISTS idx_tip_flags_tip ON tip_flags(tip_id);
      CREATE INDEX IF NOT EXISTS idx_home_teams_rink ON home_teams(rink_id);
      CREATE INDEX IF NOT EXISTS idx_referral_visits_rink ON referral_visits(rink_id);
      CREATE INDEX IF NOT EXISTS idx_rink_photos_rink ON rink_photos(rink_id);
      CREATE INDEX IF NOT EXISTS idx_rink_claims_rink ON rink_claims(rink_id);
      CREATE INDEX IF NOT EXISTS idx_operator_responses_tip ON operator_responses(tip_id);
      CREATE INDEX IF NOT EXISTS idx_nearby_places_rink ON nearby_places(rink_id);
      CREATE INDEX IF NOT EXISTS idx_nearby_places_rink_cat ON nearby_places(rink_id, category);
      CREATE INDEX IF NOT EXISTS idx_venue_metadata_rink ON venue_metadata(rink_id);
    `);

    // Load rinks
    console.log('Loading rinks.json...');
    const rinksPath = join(process.cwd(), 'public', 'data', 'rinks.json');
    const rinks: Array<{
      id: string;
      name: string;
      city: string;
      state: string;
      address?: string;
      latitude?: number;
      longitude?: number;
    }> = JSON.parse(readFileSync(rinksPath, 'utf-8'));
    console.log(`Found ${rinks.length} rinks`);

    // Batch insert rinks (100 at a time)
    const BATCH_SIZE = 100;
    let inserted = 0;
    for (let i = 0; i < rinks.length; i += BATCH_SIZE) {
      const batch = rinks.slice(i, i + BATCH_SIZE);
      const values: unknown[] = [];
      const placeholders: string[] = [];

      for (let j = 0; j < batch.length; j++) {
        const r = batch[j];
        const offset = j * 7;
        placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7})`);
        values.push(r.id, r.name, r.city, r.state, r.address || '', r.latitude ?? null, r.longitude ?? null);
      }

      await client.query(
        `INSERT INTO rinks (id, name, city, state, address, latitude, longitude)
         VALUES ${placeholders.join(', ')}
         ON CONFLICT (id) DO NOTHING`,
        values
      );
      inserted += batch.length;
      if (inserted % 500 === 0 || inserted === rinks.length) {
        console.log(`  Inserted ${inserted}/${rinks.length} rinks`);
      }
    }

    // Load signals
    console.log('Loading signals.json...');
    const signalsPath = join(process.cwd(), 'public', 'data', 'signals.json');
    const signals: Record<string, Record<string, { value: number; count: number; confidence: number }>> =
      JSON.parse(readFileSync(signalsPath, 'utf-8'));

    const rinkIds = Object.keys(signals);
    console.log(`Found signals for ${rinkIds.length} rinks`);

    let totalRatings = 0;
    const ratingValues: unknown[] = [];
    const ratingPlaceholders: string[] = [];
    let paramIndex = 1;

    for (const rinkId of rinkIds) {
      const rinkSignals = signals[rinkId];
      for (const [signal, data] of Object.entries(rinkSignals)) {
        const { value: targetAvg, count } = data;
        if (count <= 0) continue;

        // Distribute floor/ceil values to approximate the target average
        const floor = Math.floor(targetAvg);
        const ceil = Math.ceil(targetAvg);

        if (floor === ceil || floor < 1) {
          // Exact integer or edge case — all same value
          const v = Math.max(1, Math.min(5, Math.round(targetAvg)));
          for (let k = 0; k < count; k++) {
            ratingPlaceholders.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3})`);
            ratingValues.push(rinkId, signal, v, 'visiting_parent');
            paramIndex += 4;
            totalRatings++;
          }
        } else {
          // Split between floor and ceil to get target average
          const ceilCount = Math.round((targetAvg - floor) * count);
          const floorCount = count - ceilCount;
          const clampedFloor = Math.max(1, Math.min(5, floor));
          const clampedCeil = Math.max(1, Math.min(5, ceil));

          for (let k = 0; k < floorCount; k++) {
            ratingPlaceholders.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3})`);
            ratingValues.push(rinkId, signal, clampedFloor, 'visiting_parent');
            paramIndex += 4;
            totalRatings++;
          }
          for (let k = 0; k < ceilCount; k++) {
            ratingPlaceholders.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3})`);
            ratingValues.push(rinkId, signal, clampedCeil, 'visiting_parent');
            paramIndex += 4;
            totalRatings++;
          }
        }

        // Batch insert every 5000 ratings to avoid huge queries
        if (ratingPlaceholders.length >= 5000) {
          await client.query(
            `INSERT INTO signal_ratings (rink_id, signal, value, contributor_type)
             VALUES ${ratingPlaceholders.join(', ')}`,
            ratingValues
          );
          console.log(`  Inserted ${totalRatings} signal ratings so far...`);
          ratingPlaceholders.length = 0;
          ratingValues.length = 0;
          paramIndex = 1;
        }
      }
    }

    // Insert remaining ratings
    if (ratingPlaceholders.length > 0) {
      await client.query(
        `INSERT INTO signal_ratings (rink_id, signal, value, contributor_type)
         VALUES ${ratingPlaceholders.join(', ')}`,
        ratingValues
      );
    }
    console.log(`Inserted ${totalRatings} total signal ratings`);

    // Load home teams
    const homeTeamsPath = join(process.cwd(), 'public', 'data', 'home-teams.json');
    if (existsSync(homeTeamsPath)) {
      console.log('Loading home-teams.json...');
      const homeTeams: Record<string, string[]> = JSON.parse(readFileSync(homeTeamsPath, 'utf-8'));
      const rinkIdsWithTeams = Object.keys(homeTeams);
      console.log(`Found home teams for ${rinkIdsWithTeams.length} rinks`);

      const teamValues: unknown[] = [];
      const teamPlaceholders: string[] = [];
      let teamParamIndex = 1;
      let totalTeams = 0;

      for (const [htRinkId, teams] of Object.entries(homeTeams)) {
        for (const teamName of teams) {
          teamPlaceholders.push(`($${teamParamIndex}, $${teamParamIndex + 1})`);
          teamValues.push(htRinkId, teamName);
          teamParamIndex += 2;
          totalTeams++;

          // Batch insert every 2000 teams
          if (teamPlaceholders.length >= 2000) {
            await client.query(
              `INSERT INTO home_teams (rink_id, team_name)
               VALUES ${teamPlaceholders.join(', ')}
               ON CONFLICT DO NOTHING`,
              teamValues
            );
            console.log(`  Inserted ${totalTeams} home teams so far...`);
            teamPlaceholders.length = 0;
            teamValues.length = 0;
            teamParamIndex = 1;
          }
        }
      }

      // Insert remaining teams
      if (teamPlaceholders.length > 0) {
        await client.query(
          `INSERT INTO home_teams (rink_id, team_name)
           VALUES ${teamPlaceholders.join(', ')}
           ON CONFLICT DO NOTHING`,
          teamValues
        );
      }
      console.log(`Inserted ${totalTeams} total home teams`);
    } else {
      console.log('No home-teams.json found, skipping home teams seeding');
    }

    console.log('Done! Database seeded successfully.');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
