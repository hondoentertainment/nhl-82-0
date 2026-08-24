import { expect, test } from '@playwright/test';
import { openApp, playFullDraft } from './helpers';

test.describe('era lock', () => {
  test('locks one decade and finishes a season', async ({ page }) => {
    await openApp(page);
    await page.getByTestId('mode-eralock').click();
    await expect(page.getByTestId('decade-grid')).toBeVisible();
    await page.getByTestId('decade-1990s').click();
    await expect(page.getByTestId('mode-label')).toHaveText('Era Lock');
    await expect(page.getByTestId('locked-decade')).toHaveText('1990s');
    await expect(page.getByTestId('spin-button')).toHaveText('Spin franchise');
    await playFullDraft(page);
    await expect(page.getByTestId('final-record')).toHaveText(/\d+-\d+/);
    await expect(page.getByTestId('cup-run')).toBeVisible();
  });
});
