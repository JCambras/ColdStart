import type { Metadata } from 'next';
import { pool } from '../../../lib/db';

interface Props {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}

async function getRinkData(id: string) {
  const { rows } = await pool.query(
    `SELECT r.name, r.city, r.state, r.address, r.latitude, r.longitude,
            COALESCE(s.avg_value, 0) AS avg_value,
            COALESCE(s.rating_count, 0)::int AS rating_count
     FROM rinks r
     LEFT JOIN (
       SELECT rink_id, AVG(value) AS avg_value, COUNT(*)::int AS rating_count
       FROM signal_ratings GROUP BY rink_id
     ) s ON s.rink_id = r.id
     WHERE r.id = $1`,
    [id]
  );
  return rows[0] || null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    const rink = await getRinkData(id);
    if (!rink) return { title: 'Rink not found' };

    const title = `${rink.name} — ${rink.city}, ${rink.state}`;
    const description = `Scout ${rink.name} before you go. Parking, cold, food, and tips from hockey parents who were just there.`;

    return {
      title,
      description,
      openGraph: {
        title: `${title} | ColdStart Hockey`,
        description,
        siteName: 'ColdStart Hockey',
        type: 'website',
        // OG image auto-discovered from opengraph-image.tsx
      },
      twitter: {
        card: 'summary_large_image',
        title: `${title} | ColdStart Hockey`,
        description,
        // Twitter image auto-discovered from opengraph-image.tsx
      },
    };
  } catch {
    return { title: 'ColdStart Hockey' };
  }
}

export default async function RinkLayout({ params, children }: Props) {
  const { id } = await params;

  let jsonLd = null;
  try {
    const rink = await getRinkData(id);
    if (rink) {
      const avgValue = parseFloat(rink.avg_value);
      const ratingCount = rink.rating_count;

      jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'SportsActivityLocation',
        name: rink.name,
        address: {
          '@type': 'PostalAddress',
          streetAddress: rink.address || undefined,
          addressLocality: rink.city,
          addressRegion: rink.state,
          addressCountry: 'US',
        },
        ...(rink.latitude && rink.longitude
          ? {
              geo: {
                '@type': 'GeoCoordinates',
                latitude: rink.latitude,
                longitude: rink.longitude,
              },
            }
          : {}),
        ...(ratingCount > 0
          ? {
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: Math.round(avgValue * 10) / 10,
                bestRating: 5,
                worstRating: 1,
                ratingCount,
              },
            }
          : {}),
        url: `https://coldstarthockey.com/rinks/${id}`,
      };
    }
  } catch {
    // JSON-LD is non-critical; skip on error
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}
