import { expect, test } from '@playwright/test';
import { openApp, playFullDraft } from './helpers';

test.describe('career and challenge', () => {
  test('ranks two browsers on the same rematch board', async ({ browser }) => {
    test.skip(
      !process.env.PLAYWRIGHT_BASE_URL,
      'Needs live /api/challenge-board (set PLAYWRIGHT_BASE_URL)',
    );

    const host = await browser.newContext();
    const guest = await browser.newContext();
    const hostPage = await host.newPage();
    const guestPage = await guest.newPage();

    await openApp(hostPage);
    await hostPage.getByTestId('display-name-input').fill('Host Skate');
    await hostPage.getByRole('button', { name: 'Save' }).click();
    await hostPage.getByTestId('challenge-new').click();
    await playFullDraft(hostPage);
    await expect(hostPage.getByTestId('season-tape')).toBeVisible();
    const codeText = await hostPage.getByTestId('result-challenge-code').innerText();
    const code = /Challenge code:\s*([A-Z0-9]+)/.exec(codeText)?.[1];
    expect(code).toBeTruthy();

    await openApp(guestPage);
    await guestPage.getByTestId('display-name-input').fill('Guest Skate');
    await guestPage.getByRole('button', { name: 'Save' }).click();
    await guestPage.getByTestId('challenge-input').fill(code!);
    await guestPage.getByTestId('challenge-join').click();
    await playFullDraft(guestPage);
    await expect(guestPage.getByTestId('rematch-list')).toContainText('Guest Skate');
    await expect(guestPage.getByTestId('rematch-list')).toContainText('Host Skate');

    await hostPage.getByRole('button', { name: 'Home' }).click();
    await hostPage.getByTestId('nav-leaderboard').click();
    await hostPage.getByRole('button', { name: 'Challenge rematch' }).click();
    await hostPage.getByTestId('rematch-lookup').fill(code!);
    await expect(hostPage.getByTestId('rematch-list')).toContainText('Host Skate');
    await expect(hostPage.getByTestId('rematch-list')).toContainText('Guest Skate');

    await host.close();
    await guest.close();
  });

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
    await expect(page.getByTestId('game-log')).toContainText(/\d+-\d+/);
    await expect(page.getByTestId('game-log-tape')).toContainText(/Game \d+/);
  });
});
