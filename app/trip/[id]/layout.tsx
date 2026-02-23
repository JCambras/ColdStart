import type { Metadata } from 'next';
import { pool } from '../../../lib/db';

interface Props {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}

const getTripData = async (tripId: string) => {
  try {
    const { rows } = await pool.query(
      `SELECT rink_name, rink_id, team_name
       FROM trip_schedules WHERE trip_id = $1 LIMIT 1`,
      [tripId]
    );
    return rows[0] || null;
  } catch { return null; }
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const trip = await getTripData(id);

  const title = trip
    ? `${trip.team_name} at ${trip.rink_name}`
    : 'Game Day Info — ColdStart Hockey';
  const description = trip
    ? `Game day info for ${trip.team_name} at ${trip.rink_name}. Parking, food, and tips from hockey parents.`
    : 'Game times, rink intel, hotel, food, and costs for your hockey trip.';

  return {
    title,
    description,
    openGraph: {
      title: `${title} | ColdStart Hockey`,
      description,
      siteName: 'ColdStart Hockey',
      type: 'website',
      ...(trip?.rink_id ? { images: [{ url: `/rinks/${trip.rink_id}/opengraph-image`, width: 1200, height: 630 }] } : {}),
    },
    twitter: {
      card: trip ? 'summary_large_image' : 'summary',
      title: `${title} | ColdStart Hockey`,
      description,
      ...(trip?.rink_id ? { images: [`/rinks/${trip.rink_id}/opengraph-image`] } : {}),
    },
  };
}

export default function TripLayout({ children }: Props) { return children; }
