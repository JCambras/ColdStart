import { test, expect } from '@playwright/test';

test.describe('Rink detail page', () => {
  test('renders rink info from seed data', async ({ page }) => {
    await page.goto('/rinks/canton-ice-house-canton', { waitUntil: 'networkidle' });

    // Wait for loading to finish — the client component fetches seed data
    await expect(page.getByRole('heading', { name: /Canton Ice House/ })).toBeVisible({ timeout: 30000 });

    // Address link visible (use the link role to avoid matching the <title> tag)
    await expect(page.getByRole('link', { name: /Canton, MA/ })).toBeVisible();

    // Rate and tip buttons visible
    await expect(page.getByRole('button', { name: /Rate the rink/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Drop a tip/ })).toBeVisible();
  });

  test('tab bar renders with Ratings, Tips, Nearby tabs', async ({ page }) => {
    await page.goto('/rinks/canton-ice-house-canton', { waitUntil: 'networkidle' });

    await expect(page.getByRole('heading', { name: /Canton Ice House/ })).toBeVisible({ timeout: 30000 });

    // Tab bar with section tabs
    await expect(page.getByRole('tab', { name: 'Ratings' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Tips' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Nearby' })).toBeVisible();
  });
});
