import { test, expect } from '@playwright/test';

test.describe('Homepage search', () => {
  test('search for a rink and navigate to detail', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Hero section renders with search input
    const searchInput = page.getByPlaceholder('Search by rink or city').first();
    await expect(searchInput).toBeVisible();

    // Type a search query
    await searchInput.fill('Canton');

    // Wait for debounce + seed fallback results
    const result = page.getByText('Canton Ice House');
    await expect(result).toBeVisible({ timeout: 10000 });

    // Click the result to navigate
    await result.click();

    // Should be on the rink detail page
    await expect(page).toHaveURL(/\/rinks\/canton-ice-house-canton/);

    // Rink name visible in heading
    await expect(page.getByRole('heading', { name: /Canton Ice House/ })).toBeVisible({ timeout: 30000 });
  });

  test('shows no results message for unknown rink', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const searchInput = page.getByPlaceholder('Search by rink or city').first();
    await expect(searchInput).toBeVisible();
    await searchInput.fill('xyznonexistent');

    // Wait for debounce (300ms) + API call + seed fallback to complete
    await expect(page.getByText(/No rinks found/)).toBeVisible({ timeout: 15000 });
  });
});
