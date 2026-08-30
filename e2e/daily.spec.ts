import { expect, test } from '@playwright/test';
import { openApp, playFullDraft } from './helpers';

test.describe('daily challenge', () => {
  test('finishes Daily with a season tape and posts a named rank', async ({ page }) => {
    await openApp(page);
    await page.getByTestId('display-name-input').fill('Tape Check');
    await page.getByRole('button', { name: 'Save' }).click();

    await page.getByTestId('mode-daily').click();
    await expect(page.getByTestId('mode-label')).toHaveText('Daily Challenge');
    await playFullDraft(page);

    await expect(page.getByTestId('season-tape')).toBeVisible();
    const tapeGames = page.getByTestId('season-tape-game');
    await expect(tapeGames.first()).toBeVisible();
    const tapeCount = await tapeGames.count();
    expect(tapeCount).toBeGreaterThanOrEqual(5);
    expect(tapeCount).toBeLessThanOrEqual(8);

    if (process.env.PLAYWRIGHT_BASE_URL) {
      await expect(page.getByTestId('daily-rank')).toContainText(/Global daily rank: #\d+/);
      await page.getByRole('button', { name: 'Home' }).click();
      await page.getByTestId('nav-leaderboard').click();
      await expect(page.getByTestId('daily-board-list')).toContainText('Tape Check');
    }
  });
});
