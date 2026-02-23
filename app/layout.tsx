import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import BottomTabBar from './BottomTabBar';
import { ClientProviders } from '../components/ClientProviders';
import { ServiceWorkerRegistration } from '../components/ServiceWorkerRegistration';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL('https://coldstarthockey.com'),
  title: { default: 'ColdStart Hockey — Scout the rink', template: '%s | ColdStart Hockey' },
  description:
    'Real conditions from hockey parents who have been there. Parking, cold, food, chaos — summarized in seconds.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ColdStart',
  },
  icons: {
    apple: '/icon-192.png',
  },
  openGraph: {
    title: 'ColdStart Hockey — Scout the rink',
    description:
      'Real conditions from hockey parents who have been there. Parking, cold, food, chaos — summarized in seconds.',
    siteName: 'ColdStart Hockey',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/rink-photos/hero-rink.webp',
        width: 1200,
        height: 630,
        alt: 'ColdStart Hockey — Scout the rink before you go',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ColdStart Hockey — Scout the rink',
    description:
      'Real conditions from hockey parents who have been there. Parking, cold, food, chaos — summarized in seconds.',
    images: ['/rink-photos/hero-rink.webp'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: inter.style.fontFamily }}>
        <ClientProviders>
          <ServiceWorkerRegistration />
          {children}
          <BottomTabBar />
        </ClientProviders>
      </body>
    </html>
  );
}

