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

    // Wait until the write has actually landed, rather than a fixed delay:
    // the save is debounced and asynchronous, so reloading too early is racy.
    await page.waitForFunction(name => {
      try {
        const raw = localStorage.getItem('labwip_data');
        if (!raw) return false;
        return (JSON.parse(raw).tasks || []).some(t => t.name === name);
      } catch (e) { return false; }
    }, uniqueName, { timeout: 10000 });

    // Reload
    await page.reload();
    await waitForApp(page);

    // The app restores asynchronously; wait for the data to be adopted.
    await page.waitForFunction(() => AppState.tasks.length > 0, null, { timeout: 10000 });

    // Task should survive reload
    const taskNames = await page.evaluate(() => AppState.tasks.map(t => t.name));
    expect(taskNames).toContain(uniqueName);
  });
});
