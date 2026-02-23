import { Page } from '@playwright/test';

export async function mockAuthSession(page: Page) {
  await page.route('**/api/auth/session', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: { id: 'test-1', name: 'Test Parent', email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      }),
    })
  );
}
