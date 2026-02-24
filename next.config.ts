import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {};

const sentryConfig = withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  tunnelRoute: '/monitoring',
  bundleSizeOptimizations: {
    excludeDebugStatements: true,
  },
  widenClientFileUpload: true,
});

export default process.env.NODE_ENV === 'production' ? sentryConfig : nextConfig;
