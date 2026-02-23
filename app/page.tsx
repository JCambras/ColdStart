import { Suspense } from 'react';
import { pool } from '../lib/db';
import { enrichWithSummaries } from '../lib/enrichSummaries';
import HomeClient from '../components/home/HomeClient';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import type { RinkData } from '../components/RinkCard';

export const dynamic = 'force-dynamic';

const FEATURED_NAMES = [
  'Ice Line',
  'IceWorks Skating Complex',
  'Oaks Center Ice',
];

async function getFeaturedData() {
  try {
    const [{ rows: featuredRows }, countResult] = await Promise.all([
      pool.query(
        `SELECT id, name, city, state, address, latitude, longitude, created_at
         FROM rinks
         WHERE name = ANY($1) AND venue_type != 'non_ice'
         ORDER BY name`,
        [FEATURED_NAMES]
      ),
      pool.query(
        `SELECT COUNT(*)::int AS total, COUNT(DISTINCT state)::int AS states
         FROM rinks WHERE venue_type != 'non_ice'`
      ),
    ]);

    const enriched = await enrichWithSummaries(featuredRows);

    return {
      featuredRinks: enriched,
      totalRinks: countResult.rows[0].total,
      stateCount: countResult.rows[0].states,
    };
  } catch {
    return { featuredRinks: [], totalRinks: 0, stateCount: 0 };
  }
}

export default async function HomePage() {
  const { featuredRinks, totalRinks, stateCount } = await getFeaturedData();

  return (
    <Suspense fallback={<LoadingSkeleton variant="page" />}>
      <HomeClient
        initialFeaturedRinks={featuredRinks as RinkData[]}
        initialTotalRinks={totalRinks}
        initialStateCount={stateCount}
      />
    </Suspense>
  );
}
