import { expect, test } from '@playwright/test';
import { openApp, playFullDraft } from './helpers';

test.describe('four nations', () => {
  test('finishes a Face-Off season', async ({ page }) => {
    await openApp(page);
    await page.getByTestId('mode-fournations').click();
    await expect(page.getByTestId('mode-label')).toHaveText('Four Nations');
    await playFullDraft(page);
    await expect(page.getByTestId('final-record')).toHaveText(/\d+-\d+/);
    await expect(page.getByTestId('season-tape')).toBeVisible();
  });
});
