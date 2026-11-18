import { expect, test } from '@playwright/test';

test('search finds posts by words in the body text', async ({ page }) => {
  // "rsync" only appears inside a code block in the body of one post.
  await page.goto('/search/?q=rsync');
  await expect(page.locator('.pagefind-ui__result-link').first()).toHaveText('The quiet case for boring technology');
});

test('header search submits to the search page and prefills the query', async ({ page }) => {
  await page.goto('/blog/');
  await page.locator('#header-search-input').fill('kitchen');
  await page.locator('#header-search-input').press('Enter');
  await expect(page).toHaveURL(/\/search\/\?q=kitchen/);
  await expect(page.locator('.pagefind-ui__search-input')).toHaveValue('kitchen');
  await expect(page.locator('.pagefind-ui__result-link').first()).toHaveText('A slower kitchen');
});

test('search never returns drafts', async ({ page }) => {
  await page.goto('/search/?q=DRAFTSECRETWORD');
  await expect(page.locator('.pagefind-ui__message')).toContainText('No results');
});

test('search offers a category filter', async ({ page }) => {
  await page.goto('/search/?q=habits');
  await expect(page.locator('.pagefind-ui__filter-name', { hasText: 'category' })).toBeVisible();
});
