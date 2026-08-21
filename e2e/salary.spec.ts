import { expect, test } from '@playwright/test';
import { openApp, playFullDraft } from './helpers';

test.describe('salary cap', () => {
  test('completes a cap-constrained draft', async ({ page }) => {
    await openApp(page);
    await page.getByTestId('mode-salary').click();
    await expect(page.getByTestId('mode-label')).toHaveText('Salary Cap');
    await playFullDraft(page);
    await expect(page.getByTestId('final-record')).toHaveText(/\d+-\d+/);
  });
});
