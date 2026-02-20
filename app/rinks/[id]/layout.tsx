import type { Metadata } from 'next';
import { pool } from '../../../lib/db';
import { RINK_PHOTOS, getRinkSlug } from '../../../lib/rinkHelpers';

interface Props {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    const { rows } = await pool.query(
      'SELECT name, city, state FROM rinks WHERE id = $1',
      [id]
    );

    if (rows.length === 0) {
      return { title: 'Rink not found' };
    }

    const rink = rows[0];
    const title = `${rink.name} — ${rink.city}, ${rink.state}`;
    const description = `Scout ${rink.name} before you go. Parking, cold, food, and tips from hockey parents who were just there.`;
    const slug = getRinkSlug({ name: rink.name, city: rink.city });
    const photo = RINK_PHOTOS[slug];
    const images = photo ? [{ url: photo }] : undefined;

    return {
      title,
      description,
      openGraph: {
        title: `${title} | ColdStart Hockey`,
        description,
        siteName: 'ColdStart Hockey',
        type: 'website',
        images,
      },
      twitter: {
        card: photo ? 'summary_large_image' : 'summary',
        title: `${title} | ColdStart Hockey`,
        description,
        images: photo ? [photo] : undefined,
      },
    };
  } catch {
    return { title: 'ColdStart Hockey' };
  }
}

export default function RinkLayout({ children }: Props) {
  return children;
}
