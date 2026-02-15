import type { Metadata, Viewport } from 'next';
import './globals.css';
import BottomTabBar from './BottomTabBar';
import { ClientProviders } from '../components/ClientProviders';

export const metadata: Metadata = {
  title: { default: 'ColdStart Hockey — Know the rink before you get there', template: '%s | ColdStart Hockey' },
  description:
    'Real conditions from hockey parents who have been there. Parking, cold, food, chaos — summarized in seconds.',
  openGraph: {
    title: 'ColdStart Hockey — Know the rink before you get there',
    description:
      'Real conditions from hockey parents who have been there. Parking, cold, food, chaos — summarized in seconds.',
    siteName: 'ColdStart Hockey',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ColdStart Hockey — Know the rink before you get there',
    description:
      'Real conditions from hockey parents who have been there. Parking, cold, food, chaos — summarized in seconds.',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ClientProviders>
          {children}
          <BottomTabBar />
        </ClientProviders>
      </body>
    </html>
  );
}

