import { expect, test } from '@playwright/test';
import { openApp, playFullDraft } from './helpers';

test.describe('classic draft', () => {
  test('completes six rounds and shows a result', async ({ page }) => {
    await openApp(page);
    await page.getByTestId('mode-classic').click();
    await expect(page.getByTestId('draft')).toBeVisible();
    await expect(page.getByTestId('mode-label')).toHaveText('Classic');
    await playFullDraft(page);
    await expect(page.getByTestId('final-record')).toHaveText(/\d+-\d+/);
  });
});
