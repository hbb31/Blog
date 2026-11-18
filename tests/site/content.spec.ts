import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

const POST = '/blog/the-quiet-case-for-boring-technology/';

test('drafts are excluded from production output', async ({ page, request }) => {
  expect((await request.get('/blog/sample-draft-post/')).status()).toBe(404);
  await page.goto('/blog/');
  await expect(page.getByText('Sample draft post')).toHaveCount(0);
  const rss = await (await request.get('/rss.xml')).text();
  expect(rss).not.toContain('sample-draft-post');
  const sitemap = await (await request.get('/sitemap-0.xml')).text();
  expect(sitemap).not.toContain('sample-draft-post');
  expect((await request.get('/blog/tag/draft-only-tag/')).status()).toBe(404);
});

test('every post has categories, author bio, share buttons and newsletter', async ({ page }) => {
  const sitemap = readFileSync('dist/sitemap-0.xml', 'utf8');
  const posts = [...sitemap.matchAll(/<loc>[^<]*?(\/blog\/(?!category|tag)[^/<]+\/)<\/loc>/g)].map((m) => m[1]!);
  expect(posts.length).toBeGreaterThanOrEqual(4);
  for (const path of posts) {
    await page.goto(path);
    await expect(page.locator('.post__cats .chip').first()).toBeVisible();
    await expect(page.locator('.post .author--box')).toBeVisible();
    await expect(page.locator('.post .share')).toBeVisible();
    await expect(page.locator('.post .newsletter--large form')).toBeVisible();
    await expect(page.locator('aside.sidebar .newsletter form')).toBeAttached();
  }
});

test('share links are correct and load no third-party scripts', async ({ page }) => {
  const external: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith('http://localhost')) external.push(r.url());
  });
  await page.goto(POST);
  const url = encodeURIComponent(`https://example.com${POST}`);
  const share = page.locator('.share');
  await expect(share.locator('[data-share="x"]')).toHaveAttribute(
    'href',
    new RegExp(`^https://x\\.com/intent/post\\?url=${url}`),
  );
  await expect(share.locator('[data-share="linkedin"]')).toHaveAttribute(
    'href',
    `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
  );
  await expect(share.locator('[data-share="facebook"]')).toHaveAttribute(
    'href',
    `https://www.facebook.com/sharer/sharer.php?u=${url}`,
  );
  await expect(share.locator('[data-share="reddit"]')).toHaveAttribute(
    'href',
    new RegExp(`^https://www\\.reddit\\.com/submit\\?url=${url}`),
  );
  await expect(share.locator('[data-share="email"]')).toHaveAttribute('href', /^mailto:\?subject=/);
  for (const name of ['x', 'linkedin', 'facebook', 'reddit']) {
    await expect(share.locator(`[data-share="${name}"]`)).toHaveAttribute('target', '_blank');
    await expect(share.locator(`[data-share="${name}"]`)).toHaveAttribute('rel', /noopener/);
    await expect(share.locator(`[data-share="${name}"]`)).toHaveAttribute('aria-label', /Share on/);
  }
  expect(external).toEqual([]);
});

test('post page has SEO metadata and JSON-LD', async ({ page }) => {
  await page.goto(POST);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://example.com${POST}`);
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    /^https:\/\/example\.com\/_astro\//,
  );
  const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!);
  expect(ld['@type']).toBe('Article');
  expect(ld.headline).toBe('The quiet case for boring technology');
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
});

test('post page shows reading time, TOC, footnotes and related posts', async ({ page }) => {
  await page.goto(POST);
  await expect(page.locator('.post__byline')).toContainText('min read');
  await expect(page.locator('details.toc')).toBeAttached();
  await expect(page.locator('[data-footnotes]')).toBeAttached();
  await expect(page.locator('figure figcaption').first()).toBeVisible();
  await expect(page.locator('.related .post-card')).toHaveCount(3);
});

test('newsletter and contact forms render', async ({ page }) => {
  await page.goto('/');
  const nl = page.locator('aside .newsletter form');
  await expect(nl).toHaveAttribute('action', /^https:\/\/buttondown\.com\/api\/emails\/embed-subscribe\//);
  await expect(nl).toHaveAttribute('method', 'post');
  await expect(nl.getByLabel('Email address')).toHaveAttribute('type', 'email');

  await page.goto('/contact/');
  const form = page.locator('form[name="contact"]');
  await expect(form).toHaveAttribute('data-netlify', 'true');
  await expect(form).toHaveAttribute('netlify-honeypot', 'bot-field');
  await expect(form.getByLabel('Name')).toBeVisible();
  await expect(form.getByLabel('Email')).toBeVisible();
  await expect(form.getByLabel('Message')).toBeVisible();
  // Honeypot: off-screen, out of the tab order and hidden from assistive tech.
  await expect(form.locator('input[name="bot-field"]')).toHaveAttribute('tabindex', '-1');
  await expect(form.locator('.contact-form__honeypot')).toHaveAttribute('aria-hidden', 'true');
});

test('contact form shows a success message when submitted', async ({ page }) => {
  await page.goto('/contact/');
  const form = page.locator('form[name="contact"]');
  await form.getByLabel('Name').fill('Test');
  await form.getByLabel('Email').fill('test@example.com');
  await form.getByLabel('Message').fill('Hello');
  await form.getByRole('button', { name: 'Send message' }).click();
  await expect(form.getByRole('status')).toHaveText(/Thanks/);
});

test('CMS pages get their own routes', async ({ request }) => {
  expect((await request.get('/colophon/')).status()).toBe(200);
  expect((await request.get('/about/')).status()).toBe(200);
});

test('RSS, sitemap and robots.txt exist', async ({ request }) => {
  expect((await request.get('/rss.xml')).status()).toBe(200);
  expect((await request.get('/sitemap-index.xml')).status()).toBe(200);
  expect(await (await request.get('/robots.txt')).text()).toContain('Sitemap:');
});

test('dark mode toggle switches and persists the theme', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Toggle dark mode' }).click();
  const theme = await page.locator('html').getAttribute('data-theme');
  expect(theme === 'dark' || theme === 'light').toBe(true);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme!);
});
