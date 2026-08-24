import { expect, test } from '@playwright/test';
import { openApp, playFullDraft } from './helpers';

test.describe('career and challenge', () => {
  test('logs a season to career after a challenge', async ({ page }) => {
    await openApp(page);
    await page.getByTestId('challenge-new').click();
    await expect(page.getByTestId('mode-label')).toHaveText('Challenge');
    await playFullDraft(page);
    await expect(page.getByTestId('result-challenge-code')).toBeVisible();
    await expect(page.getByTestId('cup-run')).toBeVisible();
    await expect(page.getByTestId('rematch-board')).toBeVisible();
    await expect(page.getByTestId('rematch-list')).toContainText('You');
    await page.getByRole('button', { name: 'Career' }).click();
    await expect(page.getByTestId('career')).toBeVisible();
    await expect(page.getByTestId('career-stats')).toContainText('1');
  });
});
