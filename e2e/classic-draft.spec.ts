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
    await expect(page.getByTestId('cup-run')).toBeVisible();
  });

  test('undoes the last pick before the next spin', async ({ page }) => {
    await openApp(page);
    await page.getByTestId('mode-classic').click();
    await expect(page.getByTestId('undo-pick')).toBeDisabled();
    await page.getByTestId('spin-button').click();
    await expect(page.getByTestId('spin-result')).toBeVisible({ timeout: 10_000 });

    const draftButtons = page.locator(
      '[data-testid="player-list"] .player-card:not(.unaffordable) [data-testid^="draft-"]',
    );
    await expect(draftButtons.first()).toBeVisible({ timeout: 10_000 });
    await draftButtons.last().click();
    await expect(page.locator('[data-testid^="slot-"][data-filled="true"]')).toHaveCount(1);
    await expect(page.getByTestId('undo-pick')).toBeEnabled();

    await page.getByTestId('undo-pick').click();
    await expect(page.locator('[data-testid^="slot-"][data-filled="true"]')).toHaveCount(0);
    await expect(page.getByTestId('undo-pick')).toBeDisabled();
    await expect(page.getByTestId('spin-result')).toBeVisible();
  });
});
