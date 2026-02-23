import { test, expect } from '@playwright/test';

test.describe('Stale nudge banner', () => {
  test('shows nudge for old rating and persists dismissal', async ({ page }) => {
    const rinkId = 'canton-ice-house-canton';
    const thirtyOneDaysAgo = Date.now() - 31 * 24 * 60 * 60 * 1000;

    // First: navigate to establish origin and set localStorage
    await page.goto('/');
    await expect(page.getByPlaceholder('Search by rink or city').first()).toBeVisible({ timeout: 15000 });

    await page.evaluate(
      ({ rinkId, thirtyOneDaysAgo }) => {
        localStorage.setItem(
          'coldstart_rated_rinks',
          JSON.stringify({ [rinkId]: thirtyOneDaysAgo })
        );
        localStorage.setItem(
          `coldstart_viewed_meta_${rinkId}`,
          JSON.stringify({
            name: 'Canton Ice House',
            city: 'Canton',
            state: 'MA',
            viewedAt: new Date().toISOString(),
          })
        );
      },
      { rinkId, thirtyOneDaysAgo }
    );

    // Reload page — React will re-read localStorage on mount
    await page.reload();
    await expect(page.getByPlaceholder('Search by rink or city').first()).toBeVisible({ timeout: 15000 });

    // Nudge banner should be visible inside "Your Contributions" section
    const nudge = page.getByText(/Your rating of Canton Ice House is \d+ days old/);
    await expect(nudge).toBeVisible({ timeout: 15000 });

    // Click dismiss button
    await page.getByRole('button', { name: 'Dismiss' }).click();

    // Nudge should disappear
    await expect(nudge).not.toBeVisible();

    // Reload page
    await page.reload();
    await expect(page.getByPlaceholder('Search by rink or city').first()).toBeVisible({ timeout: 15000 });

    // Nudge should NOT reappear (dismissed via coldstart_nudge_dismissed_at)
    await expect(nudge).not.toBeVisible({ timeout: 3000 });
  });
});
