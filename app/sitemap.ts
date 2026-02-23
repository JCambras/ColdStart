import { MetadataRoute } from 'next';
import { pool } from '../lib/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://coldstarthockey.com';

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ];

  try {
    // All rink pages — inner try/catch in case venue_type column is missing
    let rinkResult;
    try {
      rinkResult = await pool.query(
        `SELECT id, created_at FROM rinks WHERE venue_type != 'non_ice' ORDER BY created_at DESC`
      );
    } catch {
      rinkResult = await pool.query(
        `SELECT id, created_at FROM rinks ORDER BY created_at DESC`
      );
    }
    const rinkPages: MetadataRoute.Sitemap = rinkResult.rows.map((r: { id: string; created_at: Date }) => ({
      url: `${baseUrl}/rinks/${r.id}`,
      lastModified: r.created_at,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    // State pages — inner try/catch in case venue_type column is missing
    let stateResult;
    try {
      stateResult = await pool.query(
        `SELECT DISTINCT state FROM rinks WHERE venue_type != 'non_ice' ORDER BY state`
      );
    } catch {
      stateResult = await pool.query(
        `SELECT DISTINCT state FROM rinks ORDER BY state`
      );
    }
    const statePages: MetadataRoute.Sitemap = stateResult.rows.map((r: { state: string }) => ({
      url: `${baseUrl}/states/${r.state}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));

    return [...staticPages, ...rinkPages, ...statePages];
  } catch (err) {
    console.error('Error generating sitemap:', err);
    return staticPages;
  }
}
