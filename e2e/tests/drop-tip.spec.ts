import { test, expect } from '@playwright/test';
import { mockAuthSession } from '../fixtures/auth';
import { mockContributionResponse } from '../fixtures/mock-data';

test.describe('Drop a tip (authenticated)', () => {
  test('submit a tip when logged in', async ({ page }) => {
    // Mock auth session so isLoggedIn=true, skips bot check
    await mockAuthSession(page);

    // Intercept contribution POST
    await page.route('**/api/v1/contributions', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockContributionResponse()),
      })
    );

    await page.goto('/rinks/canton-ice-house-canton', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: /Canton Ice House/ })).toBeVisible({ timeout: 30000 });

    // Click "Drop a tip" — goes directly to tip phase (no bot check for logged-in users)
    await page.getByRole('button', { name: /Drop a tip/ }).click();

    // Tip input appears
    const tipInput = page.getByLabel('Add a tip about this rink');
    await expect(tipInput).toBeVisible();

    // Type a tip
    await tipInput.fill('Great heated lobby for parents waiting');

    // Click "Add"
    await page.getByRole('button', { name: 'Add' }).click();

    // Assert success
    await expect(page.getByText('Tip added')).toBeVisible();
  });
});
