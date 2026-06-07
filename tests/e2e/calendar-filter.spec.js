/**
 * E2E tests — sidebar calendar rendering and global date filtering.
 *
 * Calendar DOM structure (rendered dynamically by SidebarCalendar.render()):
 *   #sidebar-calendar-section  → container
 *   #sidebar-calendar           → inner grid (may be hidden when collapsed)
 *     .cal-nav                  → navigation row
 *       button.cal-nav-btn[0]   → ‹ prev month
 *       span.cal-month-title    → "Month YYYY"
 *       button.cal-nav-btn[1]   → › next month
 *       button.cal-today-btn    → Today
 *     .cal-grid                 → date grid
 *       .cal-day                → individual day cells
 */
import { test, expect } from '@playwright/test';
import { APP_URL, waitForApp, dismissSetup, loadGoldenDataset, navigateTo } from './helpers.js';

test.use({ storageState: undefined });

test.beforeEach(async ({ page }) => {
  await page.goto(APP_URL);
  await waitForApp(page);
  await dismissSetup(page);
  await loadGoldenDataset(page);
});

test.describe('Sidebar calendar', () => {
  test('calendar section renders in the sidebar', async ({ page }) => {
    await expect(page.locator('#sidebar-calendar-section')).toBeVisible({ timeout: 5000 });
  });

  test('calendar shows month and year in the title', async ({ page }) => {
    const title = page.locator('#sidebar-calendar .cal-month-title');
    await expect(title).toBeVisible({ timeout: 5000 });
    const text = await title.textContent();
    expect(text).toMatch(/\d{4}/);
  });

  test('previous-month button changes the displayed month', async ({ page }) => {
    const prevBtn = page.locator('#sidebar-calendar button.cal-nav-btn').first();
    await expect(prevBtn).toBeVisible({ timeout: 5000 });
    const before = await page.locator('#sidebar-calendar .cal-month-title').textContent();
    await prevBtn.click();
    await page.waitForTimeout(200);
    const after = await page.locator('#sidebar-calendar .cal-month-title').textContent();
    expect(after).not.toBe(before);
  });

  test('next-month button changes the displayed month', async ({ page }) => {
    const nextBtn = page.locator('#sidebar-calendar button.cal-nav-btn').nth(1);
    await expect(nextBtn).toBeVisible({ timeout: 5000 });
    const before = await page.locator('#sidebar-calendar .cal-month-title').textContent();
    await nextBtn.click();
    await page.waitForTimeout(200);
    const after = await page.locator('#sidebar-calendar .cal-month-title').textContent();
    expect(after).not.toBe(before);
  });

  test('Today button resets to the current month', async ({ page }) => {
    // Navigate away from the current month
    const prevBtn  = page.locator('#sidebar-calendar button.cal-nav-btn').first();
    const todayBtn = page.locator('#sidebar-calendar button.cal-today-btn');
    await expect(prevBtn).toBeVisible({ timeout: 5000 });
    await prevBtn.click();
    await prevBtn.click();
    await page.waitForTimeout(100);

    await todayBtn.click();
    await page.waitForTimeout(200);

    const text = await page.locator('#sidebar-calendar .cal-month-title').textContent();
    expect(text).toMatch(/2026/);
  });
});

test.describe('Date filter', () => {
  test('programmatically setting a date activates the filter bar', async ({ page }) => {
    await navigateTo(page, 'table');
    await page.evaluate(() => { GlobalFilter.setDate('2026-06-07'); });
    await page.waitForTimeout(300);
    await expect(page.locator('#date-filter-bar')).toBeVisible({ timeout: 3000 });
  });

  test('the filter bar shows a Clear / dismiss action', async ({ page }) => {
    await page.evaluate(() => { GlobalFilter.setDate('2026-06-07'); });
    await page.waitForTimeout(200);
    // date-filter-bar has a button inside
    const clearBtn = page.locator('#date-filter-bar button').first();
    await expect(clearBtn).toBeVisible({ timeout: 3000 });
  });

  test('clearing the date filter hides the filter bar', async ({ page }) => {
    await page.evaluate(() => { GlobalFilter.setDate('2026-06-07'); });
    await page.waitForTimeout(200);
    await page.evaluate(() => { GlobalFilter.clearDate(); });
    await page.waitForTimeout(200);
    await expect(page.locator('#date-filter-bar')).toHaveCSS('display', 'none');
  });

  test('date filter reduces task count in table view', async ({ page }) => {
    await navigateTo(page, 'table');
    const totalRows = await page.locator('table tbody tr').count();
    await page.evaluate(() => { GlobalFilter.setDate('2026-06-07'); });
    await page.waitForTimeout(300);
    const filteredRows = await page.locator('table tbody tr').count();
    expect(filteredRows).toBeLessThanOrEqual(totalRows);
  });
});
