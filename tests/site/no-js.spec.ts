import { expect, test } from '@playwright/test';

test.use({ javaScriptEnabled: false });

test('category and tag filters work without JavaScript', async ({ page }) => {
  await page.goto('/blog/');
  const filters = page.getByRole('navigation', { name: 'Filter posts' });
  await filters.getByRole('link', { name: /Lifestyle/ }).click();
  await expect(page).toHaveURL(/\/blog\/category\/lifestyle\/$/);
  await expect(
    page.getByRole('navigation', { name: 'Filter posts' }).getByRole('link', { name: /Lifestyle/ }),
  ).toHaveAttribute('aria-current', 'page');
  const titles = await page.locator('.post-list .post-card__title').allInnerTexts();
  expect(titles).toContain('A slower kitchen');
  expect(titles).not.toContain('Deep work without the hustle');

  await page.getByRole('link', { name: '#writing' }).click();
  await expect(page).toHaveURL(/\/blog\/tag\/writing\/$/);
  await expect(page.locator('.post-list .post-card__title')).toHaveText(['Notes on writing every day']);
});

test('without JavaScript the Categories nav item is a plain link', async ({ page }) => {
  await page.goto('/');
  const link = page.locator('#site-nav').getByRole('link', { name: 'Categories' });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('href', '/blog/#categories');
});
