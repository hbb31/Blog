import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const pages = [
  '/',
  '/blog/',
  '/blog/category/technology/',
  '/blog/tag/habits/',
  '/blog/the-quiet-case-for-boring-technology/',
  '/about/',
  '/contact/',
  '/search/?q=focus',
  '/404.html',
];

for (const path of pages) {
  for (const scheme of ['light', 'dark'] as const) {
    test(`axe: ${path} (${scheme}) has no WCAG 2.2 AA violations`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto(path);
      if (path.startsWith('/search')) await page.locator('.pagefind-ui__result').first().waitFor();
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`)).toEqual([]);
    });
  }
}

test('axe: open dropdown menu has no violations', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Categories' }).click();
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze();
  expect(results.violations).toEqual([]);
});
