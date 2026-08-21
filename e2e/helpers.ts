import { expect, type Page } from '@playwright/test';

export async function openApp(page: Page) {
  await page.addInitScript(() => {
    window.__E2E__ = true;
  });
  await page.goto('/');
  await expect(page.getByTestId('home')).toBeVisible();
}

async function draftOnePick(page: Page) {
  for (let attempt = 0; attempt < 12; attempt++) {
    const draftButtons = page.locator(
      '[data-testid="player-list"] .player-card:not(.unaffordable) [data-testid^="draft-"]',
    );
    if ((await draftButtons.count()) > 0) {
      await draftButtons.last().click();
      await expect(page.getByTestId('spin-result')).toBeHidden({ timeout: 8_000 });
      return;
    }

    const respin = page.getByTestId('respin');
    if (await respin.isVisible().catch(() => false)) {
      await respin.click();
      await expect(page.getByTestId('spin-result')).toBeVisible();
      continue;
    }

    const skipTeam = page.getByTestId('skip-team');
    if (await skipTeam.isEnabled().catch(() => false)) {
      await skipTeam.click();
      await expect(page.getByTestId('spin-result')).toBeVisible();
      continue;
    }

    const skipDecade = page.getByTestId('skip-decade');
    if (await skipDecade.isEnabled().catch(() => false)) {
      await skipDecade.click();
      await expect(page.getByTestId('spin-result')).toBeVisible();
      continue;
    }

    throw new Error('No draft pick available');
  }

  throw new Error('Exhausted redraw attempts');
}

/** Complete a full 6-round draft by spinning and taking a legal pick each round */
export async function playFullDraft(page: Page) {
  for (let round = 0; round < 6; round++) {
    const onResult = await page.getByTestId('result').isVisible().catch(() => false);
    if (onResult) break;

    await expect(page.getByTestId('draft')).toBeVisible();
    await expect(page.getByTestId('spin-button')).toBeVisible({ timeout: 10_000 });
    await page.getByTestId('spin-button').click();
    await expect(page.getByTestId('spin-result')).toBeVisible({ timeout: 10_000 });
    await draftOnePick(page);
  }

  await expect(page.getByTestId('result')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId('final-record')).toBeVisible();
  await expect(page.getByTestId('final-grade')).toBeVisible();
}
