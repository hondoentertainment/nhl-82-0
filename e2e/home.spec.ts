import { expect, test } from '@playwright/test';
import { openApp } from './helpers';

test.describe('home', () => {
  test('shows brand and mode entry points', async ({ page }) => {
    await openApp(page);
    await expect(page.getByTestId('brand')).toContainText('82');
    await expect(page.getByTestId('mode-classic')).toBeVisible();
    await expect(page.getByTestId('mode-iceiq')).toBeVisible();
    await expect(page.getByTestId('mode-salary')).toBeVisible();
    await expect(page.getByTestId('mode-franchise')).toBeVisible();
    await expect(page.getByTestId('mode-tough')).toBeVisible();
    await expect(page.getByTestId('mode-daily')).toBeVisible();
    await expect(page.getByTestId('mode-challenge')).toBeVisible();
  });

  test('opens how to play, leaderboards, and career', async ({ page }) => {
    await openApp(page);
    await page.getByTestId('nav-how').click();
    await expect(page.getByRole('heading', { name: /How to play/i })).toBeVisible();
    await page.getByRole('button', { name: /Back/i }).click();
    await expect(page.getByTestId('home')).toBeVisible();

    await page.getByTestId('nav-leaderboard').click();
    await expect(page.getByRole('heading', { name: /Leaderboards/i })).toBeVisible();
    await page.getByRole('button', { name: /Back/i }).click();

    await page.getByTestId('nav-career').click();
    await expect(page.getByTestId('career')).toBeVisible();
  });
});
