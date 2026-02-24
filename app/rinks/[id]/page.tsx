import { Suspense } from 'react';
import { Metadata } from 'next';
import { RinkPageClient } from './RinkPageClient';

interface RinkSeed {
  id: string;
  name: string;
  city: string;
  state: string;
}

interface SignalData {
  value: number;
  count: number;
  confidence: number;
}

async function getRinkSeed(id: string) {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    const rinksPath = path.join(process.cwd(), 'public', 'data', 'rinks.json');
    const raw = await fs.readFile(rinksPath, 'utf-8');
    const rinks: RinkSeed[] = JSON.parse(raw);
    return rinks.find(r => r.id === id) || null;
  } catch {
    return null;
  }
}

async function getSignalsSeed(id: string) {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    const signalsPath = path.join(process.cwd(), 'public', 'data', 'signals.json');
    const raw = await fs.readFile(signalsPath, 'utf-8');
    const signals: Record<string, Record<string, SignalData>> = JSON.parse(raw);
    return signals[id] || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const rink = await getRinkSeed(id);

  if (!rink) {
    return {
      title: 'Rink not found — ColdStart Hockey',
    };
  }

  const signals = await getSignalsSeed(id);
  const totalRatings = signals
    ? Object.values(signals).reduce((sum, s) => sum + s.count, 0)
    : 0;

  const parking = signals?.parking;
  const cold = signals?.cold;
  const snippets: string[] = [];
  if (parking && parking.count >= 3) snippets.push(`Parking: ${parking.value.toFixed(1)}/5`);
  if (cold && cold.count >= 3) snippets.push(`Comfort: ${cold.value.toFixed(1)}/5`);

  const title = `${rink.name} — ${rink.city}, ${rink.state} | ColdStart Hockey`;
  const description = totalRatings > 0
    ? `${rink.name} in ${rink.city}, ${rink.state}. ${snippets.join(' · ')}${snippets.length ? ' · ' : ''}${totalRatings} parent ratings. Parking, comfort, food nearby — from hockey parents who've been there.`
    : `${rink.name} in ${rink.city}, ${rink.state}. Parking, comfort, food nearby — from hockey parents who've been there.`;

  return {
    title,
    description,
    openGraph: {
      title: `${rink.name} — ${rink.city}, ${rink.state}`,
      description,
      type: 'website',
      siteName: 'ColdStart Hockey',
    },
    twitter: {
      card: 'summary',
      title: `${rink.name} — ${rink.city}, ${rink.state}`,
      description,
    },
  };
}

export default function RinkPage() {
  return (
    <Suspense>
      <RinkPageClient />
    </Suspense>
  );
}
