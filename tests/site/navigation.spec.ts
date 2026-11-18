import { expect, test } from '@playwright/test';

test('top navigation has Home | Blog | Categories | About | Contact in order', async ({ page }) => {
  await page.goto('/');
  const items = page.locator('#site-nav .site-nav__list > li');
  await expect(items).toHaveText([/Home/, /Blog/, /Categories/, /About/, /Contact/]);
});

test('categories dropdown works with the keyboard', async ({ page }) => {
  await page.goto('/');
  const button = page.getByRole('button', { name: 'Categories' });
  const menu = page.locator('.dropdown__menu');
  await button.focus();
  await page.keyboard.press('Enter');
  await expect(button).toHaveAttribute('aria-expanded', 'true');
  await expect(menu).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(button).toHaveAttribute('aria-expanded', 'false');
  await expect(button).toBeFocused();

  await page.keyboard.press('Space');
  await expect(menu).toBeVisible();
  await page.keyboard.press('Escape');

  await page.keyboard.press('ArrowDown');
  await expect(menu.getByRole('link').first()).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(menu.getByRole('link').nth(1)).toBeFocused();
  await page.keyboard.press('End');
  await expect(menu.getByRole('link').last()).toBeFocused();

  // Tabbing out of the menu closes it.
  await page.keyboard.press('Tab');
  await expect(button).toHaveAttribute('aria-expanded', 'false');
});

test('categories dropdown items come from the CMS in order and link to archives', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Categories' }).click();
  const links = page.locator('.dropdown__menu a');
  await expect(links).toHaveText(['IT', 'Games', 'Memes', 'Random']);
  await links.nth(1).click();
  await expect(page).toHaveURL(/\/blog\/category\/games\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Games');
});

test('clicking outside closes the dropdown', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Categories' }).click();
  await page.locator('main').click({ position: { x: 5, y: 5 } });
  await expect(page.locator('.dropdown__menu')).toBeHidden();
});

test('mobile menu is a disclosure that works by touch @mobile', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile only');
  await page.goto('/');
  const menuButton = page.getByRole('button', { name: 'Menu' });
  await expect(page.locator('#site-nav')).toBeHidden();
  await menuButton.tap();
  await expect(menuButton).toHaveAttribute('aria-expanded', 'true');
  await page.getByRole('button', { name: 'Categories' }).tap();
  await page.locator('.dropdown__menu').getByRole('link', { name: 'Random' }).tap();
  await expect(page).toHaveURL(/\/blog\/category\/random\/$/);
});

test('skip link moves focus to main content', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to content' });
  await expect(skip).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#main$/);
});
