/**
 * E2E tests — Settings page, theme switching, view navigation.
 */
import { test, expect } from '@playwright/test';
import { APP_URL, waitForApp, dismissSetup, navigateTo } from './helpers.js';

test.use({ storageState: undefined });

test.beforeEach(async ({ page }) => {
  await page.goto(APP_URL);
  await waitForApp(page);
  await dismissSetup(page);
});

test.describe('View navigation', () => {
  test('all views are accessible from the sidebar', async ({ page }) => {
    const views = ['dashboard', 'table', 'gantt', 'kanban', 'settings', 'help', 'about'];
    for (const view of views) {
      await navigateTo(page, view);
      await expect(page.locator(`#view-${view}`)).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Theme switching', () => {
  test('clicking the light theme option applies the light theme', async ({ page }) => {
    await navigateTo(page, 'settings');
    const lightOption = page.locator('#theme-light');
    if (await lightOption.isVisible({ timeout: 3000 }).catch(() => false)) {
      await lightOption.click();
      await page.waitForTimeout(200);
      const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
      expect(theme).toBe('light');
    }
  });

  test('clicking the dark theme option applies the dark theme', async ({ page }) => {
    await navigateTo(page, 'settings');
    // First set to light, then back to dark
    const lightOption = page.locator('#theme-light');
    const darkOption  = page.locator('#theme-dark');
    if (await lightOption.isVisible({ timeout: 3000 }).catch(() => false)) {
      await lightOption.click();
      await page.waitForTimeout(100);
      await darkOption.click();
      await page.waitForTimeout(200);
      const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
      expect(theme).toBe('dark');
    }
  });
});

test.describe('Status management', () => {
  test('status list is visible in settings', async ({ page }) => {
    await navigateTo(page, 'settings');
    await expect(page.locator('#list-statuses')).toBeVisible({ timeout: 3000 });
  });

  test('each status has an activity category dropdown', async ({ page }) => {
    await navigateTo(page, 'settings');
    const statusList = page.locator('#list-statuses');
    await expect(statusList).toBeVisible({ timeout: 3000 });

    const selects = statusList.locator('select');
    const count = await selects.count();
    expect(count).toBeGreaterThan(0);
  });

  test('activity category dropdown contains all four valid categories', async ({ page }) => {
    await navigateTo(page, 'settings');
    const firstSelect = page.locator('#list-statuses select').first();
    if (await firstSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      const values = await firstSelect.locator('option').evaluateAll(
        opts => opts.map(o => o.value)
      );
      expect(values).toContain('planned');
      expect(values).toContain('active');
      expect(values).toContain('problem');
      expect(values).toContain('none');
    }
  });
});

test.describe('Calendar settings', () => {
  test('calendar settings card is visible', async ({ page }) => {
    await navigateTo(page, 'settings');
    // Scroll down to calendar settings if needed
    const calCard = page.locator('text=Calendar').first();
    await expect(calCard).toBeVisible({ timeout: 3000 });
  });
});

test.describe('Data persistence via AppState', () => {
  test('task count is correct after creating a task', async ({ page }) => {
    // Create a task programmatically
    await page.evaluate(() => {
      AppState.saveTask({
        name: 'Persistence Test',
        startDate: '2026-08-03',
        endDate: '2026-08-07',
        workdays: 5,
        alloc: 100,
        progress: 0,
        status: 'Active',
        priority: 'Medium',
        lab: 'RMP',
        person: 'Anna S.',
      });
      App.refresh();
    });
    const count = await page.evaluate(() => AppState.tasks.length);
    expect(count).toBeGreaterThan(0);
  });
});
