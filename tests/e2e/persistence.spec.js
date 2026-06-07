/**
 * E2E tests — data persistence via localStorage across page reloads.
 */
import { test, expect } from '@playwright/test';
import { APP_URL, waitForApp, dismissSetup, openNewTaskModal, fillAndSaveTask } from './helpers.js';

test.use({ storageState: undefined });

test.describe('LocalStorage persistence', () => {
  test('task survives a page reload', async ({ page }) => {
    await page.goto(APP_URL);
    await waitForApp(page);
    await dismissSetup(page);

    const uniqueName = `Persist_${Date.now()}`;
    await openNewTaskModal(page);
    await fillAndSaveTask(page, {
      name: uniqueName,
      startDate: '2026-08-03',
      workdays: 3,
    });
    await expect(page.locator('#modal-overlay')).not.toHaveClass(/open/, { timeout: 3000 });

    // Verify task was saved
    const countBefore = await page.evaluate(() => AppState.tasks.length);
    expect(countBefore).toBeGreaterThan(0);

    // Force save to localStorage
    await page.evaluate(() => Storage.save());
    await page.waitForTimeout(500);

    // Reload
    await page.reload();
    await waitForApp(page);

    // Task should survive reload
    const taskNames = await page.evaluate(() => AppState.tasks.map(t => t.name));
    expect(taskNames).toContain(uniqueName);
  });
});
