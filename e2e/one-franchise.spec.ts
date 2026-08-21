import { expect, test } from '@playwright/test';
import { openApp, playFullDraft } from './helpers';

test.describe('one franchise', () => {
  test('locks a club and finishes a season', async ({ page }) => {
    await openApp(page);
    await page.getByTestId('mode-franchise').click();
    await expect(page.getByTestId('franchise-grid')).toBeVisible();
    await page.getByTestId('franchise-edm').click();
    await expect(page.getByTestId('mode-label')).toHaveText('One Franchise');
    await playFullDraft(page);
    await expect(page.getByTestId('final-record')).toHaveText(/\d+-\d+/);
  });
});
