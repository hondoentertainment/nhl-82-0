import { expect, test } from '@playwright/test';
import { openApp, playFullDraft } from './helpers';

test.describe('ironman', () => {
  test('finishes a season with no undo or skips', async ({ page }) => {
    await openApp(page);
    await page.getByTestId('mode-ironman').click();
    await expect(page.getByTestId('mode-label')).toHaveText('Ironman');
    await expect(page.getByTestId('undo-pick')).toHaveCount(0);
    await playFullDraft(page);
    await expect(page.getByTestId('final-record')).toHaveText(/\d+-\d+/);
    await expect(page.getByTestId('season-tape')).toBeVisible();
  });
});
