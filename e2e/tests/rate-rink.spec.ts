import { test, expect } from '@playwright/test';
import { mockContributionResponse } from '../fixtures/mock-data';

test.describe('Rate a rink (unauthenticated)', () => {
  test('complete the rating flow with bot check', async ({ page }) => {
    await page.goto('/rinks/canton-ice-house-canton', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: /Canton Ice House/ })).toBeVisible({ timeout: 30000 });

    // Intercept contribution POST
    await page.route('**/api/v1/contributions', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockContributionResponse()),
      })
    );

    // Click "Rate the rink"
    await page.getByRole('button', { name: /Rate the rink/ }).click();

    // Bot check appears — parse "What is N + 3?"
    const questionText = await page.getByText(/What is \d+ \+ 3\?/).textContent();
    const match = questionText?.match(/What is (\d+) \+ 3\?/);
    expect(match).toBeTruthy();
    const answer = parseInt(match![1]) + 3;

    // Fill the answer and submit
    await page.getByLabel('Answer to verification question').fill(String(answer));
    await page.getByRole('button', { name: 'Go' }).click();

    // Rating UI appears
    await expect(page.getByText('Rate the signals')).toBeVisible();

    // Click a rating value (e.g., "4" for Parking)
    await page.getByRole('button', { name: 'Rate Parking 4 out of 5' }).click();

    // Click "Done"
    await page.getByRole('button', { name: 'Done' }).click();

    // Assert success state
    await expect(page.getByText('Rating submitted')).toBeVisible();
  });
});
