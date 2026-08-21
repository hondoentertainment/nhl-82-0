import { expect, test } from '@playwright/test';
import { openApp, playFullDraft } from './helpers';

test.describe('ice iq', () => {
  test('completes a blind draft', async ({ page }) => {
    await openApp(page);
    await page.getByTestId('mode-iceiq').click();
    await expect(page.getByTestId('mode-label')).toHaveText('Ice IQ');
    await playFullDraft(page);
    await expect(page.getByTestId('final-grade')).toBeVisible();
  });
});
