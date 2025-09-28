import { test, expect } from '@playwright/test';

test.describe.skip('catalog happy path', () => {
  test('admin can create catalog product and seller can list it', async ({ page }) => {
    // Placeholder flow outline:
    // 1. Login as admin and navigate to /admin/catalog
    // 2. Create a new catalog product with one variant.
    // 3. Login as seller and navigate to /seller/listings to create a listing.
    // 4. Visit storefront product page and verify listing details are visible.

    await page.goto('/');
    await expect(page.getByRole('heading', { name: /featured/i })).toBeVisible();
  });
});
