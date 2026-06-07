/**
 * E2E tests — task creation, editing, and deletion.
 * Runs in a real browser via Playwright against the Python-served WIPflow.html.
 */
import { test, expect } from '@playwright/test';
import { APP_URL, waitForApp, dismissSetup, navigateTo, openNewTaskModal, fillAndSaveTask } from './helpers.js';

test.use({ storageState: undefined });

test.beforeEach(async ({ page }) => {
  await page.goto(APP_URL);
  await waitForApp(page);
  await dismissSetup(page);
});

test.describe('Task creation', () => {
  test('creates a new task and it appears in the table', async ({ page }) => {
    await openNewTaskModal(page);
    await fillAndSaveTask(page, {
      name: 'E2E Test Task',
      startDate: '2026-08-03',
      workdays: 5,
    });
    await expect(page.locator('#modal-overlay')).not.toHaveClass(/open/, { timeout: 3000 });
    await navigateTo(page, 'table');
    await expect(page.locator('text=E2E Test Task')).toBeVisible({ timeout: 3000 });
  });

  test('modal defaults start date to today', async ({ page }) => {
    await openNewTaskModal(page);
    const startVal = await page.locator('#f-start').inputValue();
    expect(startVal).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('calculates end date when workdays and allocation are entered', async ({ page }) => {
    await openNewTaskModal(page);
    await page.fill('#f-start', '2026-08-03'); // Monday
    await page.fill('#f-workdays', '5');
    await page.fill('#f-alloc', '100');
    await page.locator('#f-workdays').blur();
    await page.waitForTimeout(200);
    const endVal = await page.locator('#f-enddate').inputValue();
    expect(endVal).toBe('2026-08-07'); // 5 workdays from Mon = Fri
  });

  test('Escape key closes the modal without saving', async ({ page }) => {
    await navigateTo(page, 'table');
    const rowsBefore = await page.locator('table tbody tr').count().catch(() => 0);

    await openNewTaskModal(page);
    await page.fill('#f-name', 'Should Not Be Saved');
    await page.keyboard.press('Escape');
    await expect(page.locator('#modal-overlay')).not.toHaveClass(/open/, { timeout: 3000 });

    const rowsAfter = await page.locator('table tbody tr').count().catch(() => 0);
    expect(rowsAfter).toBe(rowsBefore);
  });
});

test.describe('Task editing', () => {
  test.beforeEach(async ({ page }) => {
    // Create a task to edit
    await openNewTaskModal(page);
    await fillAndSaveTask(page, {
      name: 'Task To Edit',
      startDate: '2026-08-03',
      workdays: 3,
    });
    await expect(page.locator('#modal-overlay')).not.toHaveClass(/open/, { timeout: 3000 });
    await navigateTo(page, 'table');
  });

  test('clicking a task row opens the edit modal with existing data', async ({ page }) => {
    await page.locator('tr', { hasText: 'Task To Edit' }).click();
    await expect(page.locator('#modal-overlay')).toHaveClass(/open/, { timeout: 3000 });
    await expect(page.locator('#f-name')).toHaveValue('Task To Edit');
  });

  test('editing and saving updates the task in the table', async ({ page }) => {
    await page.locator('tr', { hasText: 'Task To Edit' }).click();
    await expect(page.locator('#modal-overlay')).toHaveClass(/open/, { timeout: 3000 });
    await page.fill('#f-name', 'Task Was Edited');
    await page.locator('button:has-text("Save Task")').click();
    await expect(page.locator('#modal-overlay')).not.toHaveClass(/open/, { timeout: 3000 });
    await expect(page.locator('text=Task Was Edited')).toBeVisible({ timeout: 3000 });
  });
});

test.describe('Task deletion', () => {
  test('deleting a task removes it from the table', async ({ page }) => {
    await openNewTaskModal(page);
    await fillAndSaveTask(page, {
      name: 'Task To Delete',
      startDate: '2026-08-03',
      workdays: 2,
    });
    await expect(page.locator('#modal-overlay')).not.toHaveClass(/open/, { timeout: 3000 });
    await navigateTo(page, 'table');
    await expect(page.locator('text=Task To Delete')).toBeVisible({ timeout: 3000 });

    // Open edit modal
    await page.locator('tr', { hasText: 'Task To Delete' }).click();
    await expect(page.locator('#modal-overlay')).toHaveClass(/open/, { timeout: 3000 });

    // Delete button is only visible when editing an existing task
    const deleteBtn = page.locator('#modal-delete-btn');
    await expect(deleteBtn).toBeVisible({ timeout: 2000 });
    page.on('dialog', dialog => dialog.accept());
    await deleteBtn.click();

    await expect(page.locator('#modal-overlay')).not.toHaveClass(/open/, { timeout: 3000 });
    await expect(page.locator('text=Task To Delete')).not.toBeVisible({ timeout: 3000 });
  });
});
