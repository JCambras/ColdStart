import { Metadata } from 'next';
import { US_STATES } from '../../../lib/constants';

interface Props {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const upper = code.toUpperCase();
  const stateName = US_STATES[upper] || upper;

  const title = `Hockey Rinks in ${stateName}`;
  const description = `Browse hockey rinks in ${stateName}. Real conditions from hockey parents — parking, comfort, food, and more.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

export default function StateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
