import { expect, test, type Locator, type Page } from '@playwright/test';
import { existsSync, rmSync } from 'node:fs';

/**
 * Creates a category, a page and a post through the Keystatic admin UI
 * (local mode), checks they appear on the site, then deletes them in the CMS.
 */
const files = [
  'src/content/categories/zeta-category.yaml',
  'src/content/pages/zeta-page.mdx',
  'src/content/posts/zeta-post.mdx',
];

test.afterAll(() => files.forEach((f) => rmSync(f, { force: true })));

/**
 * The dev server reloads the page while Vite optimises dependencies and after
 * content files change, so navigate with retries and wait for the form.
 */
async function openCms(page: Page, path: string, ready: (p: Page) => Locator) {
  await test.step(`open /keystatic/${path}`, async () => {
    try {
      await expect(async () => {
        await page.goto(`/keystatic/${path}`);
        await expect(ready(page)).toBeVisible({ timeout: 15_000 });
      }).toPass({ timeout: 90_000 });
    } catch (error) {
      await page.screenshot({ path: `test-results/cms-failure-${path.replace(/\W+/g, '-')}.png` });
      throw error;
    }
  });
}

test('create, view and delete content in the CMS', async ({ page }) => {
  // Warm up: the first load triggers Vite dependency optimisation and a reload.
  await openCms(page, 'collection/posts', (p) => p.getByRole('link', { name: 'Posts' }).first());

  await openCms(page, 'collection/categories/create', (p) => p.getByRole('textbox', { name: /^Name/ }));
  await page.getByRole('textbox', { name: /^Name/ }).fill('Zeta Category');
  await page.getByRole('button', { name: 'Create' }).click();
  await expect.poll(() => existsSync(files[0]!)).toBe(true);

  await openCms(page, 'collection/pages/create', (p) => p.getByRole('textbox', { name: /^Title/ }));
  await page.getByRole('textbox', { name: /^Title/ }).fill('Zeta Page');
  await page.getByLabel('Show in top navigation').check();
  await page.locator('[contenteditable="true"]').first().click();
  await page.keyboard.type('Hello from a CMS page.');
  await page.getByRole('button', { name: 'Create' }).click();
  await expect.poll(() => existsSync(files[1]!)).toBe(true);

  await openCms(page, 'collection/posts/create', (p) => p.getByRole('textbox', { name: /^Title/ }));
  await page.getByRole('textbox', { name: /^Title/ }).fill('Zeta Post');
  await page.getByRole('textbox', { name: /^Excerpt/ }).fill('An end-to-end test post.');
  await page.locator('[contenteditable="true"]').first().click();
  await page.keyboard.type('Body text.');
  // A post can't be saved without a category.
  await page.getByRole('button', { name: 'Create' }).click();
  await expect(page.getByText('Must have at least 1 item.')).toBeVisible();
  expect(existsSync(files[2]!)).toBe(false);
  const combo = page.getByRole('combobox', { name: /^Categories/ });
  await combo.click();
  await combo.fill('zeta');
  await page.getByRole('option', { name: /zeta-category/ }).click();
  await page.getByRole('button', { name: 'Create' }).click();
  await expect.poll(() => existsSync(files[2]!)).toBe(true);

  // The new page is routed and in the nav; the new category is in the dropdown; the draft post shows in dev.
  await expect.poll(async () => (await page.request.get('/zeta-page/')).status(), { timeout: 30_000 }).toBe(200);
  await page.goto('/');
  await expect(page.locator('#site-nav').getByRole('link', { name: 'Zeta Page' })).toBeVisible();
  await page.getByRole('button', { name: 'Categories' }).click();
  await expect(page.locator('.dropdown__menu').getByRole('link', { name: 'Zeta Category' })).toBeVisible();
  await expect.poll(async () => (await page.request.get('/blog/zeta-post/')).status(), { timeout: 30_000 }).toBe(200);

  // Delete everything through the CMS.
  const toDelete: [string, string][] = [
    ['posts/item/zeta-post', files[2]!],
    ['pages/item/zeta-page', files[1]!],
    ['categories/item/zeta-category', files[0]!],
  ];
  for (const [path, file] of toDelete) {
    await openCms(page, `collection/${path}`, (p) => p.getByRole('button', { name: /delete/i }).first());
    await page
      .getByRole('button', { name: /delete/i })
      .first()
      .click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Yes, delete' }).click();
    await expect.poll(() => existsSync(file)).toBe(false);
    // The dev server hot-reloads after content changes; let it settle.
    await page.waitForTimeout(2000);
  }
  await expect.poll(() => files.some((f) => existsSync(f))).toBe(false);
});
