import { test, expect, Page } from '@playwright/test';

/** Navigate to rink page, retrying with reload if client component fails to hydrate */
async function gotoRinkPage(page: Page, rinkId: string) {
  await page.goto(`/rinks/${rinkId}`);
  try {
    await page.waitForSelector('h1', { timeout: 15000 });
  } catch {
    // Dev server occasionally fails to hydrate on first load — reload
    await page.reload();
    await page.waitForSelector('h1', { timeout: 30000 });
  }
}

test.describe('Rink detail page', () => {
  test('renders rink info from seed data', async ({ page }) => {
    await gotoRinkPage(page, 'canton-ice-house-canton');

    await expect(page.getByRole('heading', { name: /Canton Ice House/ })).toBeVisible();

    // Address link visible
    await expect(page.getByRole('link', { name: /Canton, MA/ })).toBeVisible();

    // Rate and tip buttons visible
    await expect(page.getByRole('button', { name: /Rate the rink/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Drop a tip/ })).toBeVisible();
  });

  test('tab bar renders with Ratings, Tips, Nearby tabs', async ({ page }) => {
    await gotoRinkPage(page, 'canton-ice-house-canton');

    await expect(page.getByRole('heading', { name: /Canton Ice House/ })).toBeVisible();

    // Tab bar with section tabs
    await expect(page.getByRole('tab', { name: 'Ratings' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Tips' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Nearby' })).toBeVisible();
  });
});
