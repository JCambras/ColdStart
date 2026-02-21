import type { Metadata } from 'next';
import { pool } from '../../../lib/db';

interface Props {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}

async function getFieldData(id: string) {
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
    const field = await getFieldData(id);
    if (!field) return { title: 'Field not found' };

    const title = `${field.name} — ${field.city}, ${field.state}`;
    const description = `Scout ${field.name} before you go. Parking, heat, dugouts, and tips from baseball parents who were just there.`;

    return {
      title,
      description,
      openGraph: {
        title: `${title} | ColdStart Baseball`,
        description,
        siteName: 'ColdStart',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${title} | ColdStart Baseball`,
        description,
      },
    };
  } catch {
    return { title: 'ColdStart Baseball' };
  }
}

export default async function FieldLayout({ params, children }: Props) {
  const { id } = await params;

  let jsonLd = null;
  try {
    const field = await getFieldData(id);
    if (field) {
      const avgValue = parseFloat(field.avg_value);
      const ratingCount = field.rating_count;

      jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'SportsActivityLocation',
        name: field.name,
        address: {
          '@type': 'PostalAddress',
          streetAddress: field.address || undefined,
          addressLocality: field.city,
          addressRegion: field.state,
          addressCountry: 'US',
        },
        ...(field.latitude && field.longitude
          ? {
              geo: {
                '@type': 'GeoCoordinates',
                latitude: field.latitude,
                longitude: field.longitude,
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
        url: `https://coldstarthockey.com/fields/${id}`,
      };
    }
  } catch {
    // JSON-LD is non-critical
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
