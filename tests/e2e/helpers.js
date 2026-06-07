/**
 * Shared helpers for Playwright E2E tests.
 * All selectors derived from the actual WIPflow.html DOM structure.
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const APP_URL = `http://localhost:5501/WIPflow.html`;

/** Load the golden dataset into AppState via page.evaluate */
export async function loadGoldenDataset(page) {
  const raw = readFileSync(resolve(__dirname, '../fixtures/golden-project.wipflow'), 'utf8');
  await page.evaluate((json) => {
    AppState.fromJSON(JSON.parse(json));
    App.refresh();
  }, raw);
}

/** Wait for the app to finish initializing (sidebar logo visible) */
export async function waitForApp(page) {
  await page.waitForSelector('#sidebar-logo', { timeout: 15000 });
}

/** Dismiss the first-time setup overlay if it appears (Chrome/Edge only) */
export async function dismissSetup(page) {
  const overlay = page.locator('#setup-overlay');
  if (await overlay.isVisible({ timeout: 2000 }).catch(() => false)) {
    await page.locator('#setup-use-browser').click();
    await page.waitForTimeout(300);
  }
}

/**
 * Navigate to a view via its sidebar button.
 * Uses data-view attribute which is present on all nav buttons.
 */
export async function navigateTo(page, view) {
  await page.locator(`[data-view="${view}"]`).click();
  await page.waitForTimeout(150);
}

/**
 * Open the "New Task" modal by clicking the primary sidebar button.
 * There are two "+ New Task" buttons; we use the sidebar one.
 */
export async function openNewTaskModal(page) {
  // The sidebar has a "+ New Task" button
  await page.locator('button:has-text("+ New Task")').first().click();
  await page.waitForSelector('#modal-overlay.open', { timeout: 5000 });
}

/**
 * Fill the task modal with the provided data and save.
 * Field IDs: #f-name, #f-lab, #f-person, #f-priority, #f-status,
 *             #f-start, #f-workdays, #f-alloc
 */
export async function fillAndSaveTask(page, { name, lab, person, priority, status, startDate, workdays, alloc } = {}) {
  if (name)      await page.fill('#f-name', name);
  if (lab)       await page.selectOption('#f-lab', lab);
  if (person)    await page.selectOption('#f-person', person);
  if (priority)  await page.selectOption('#f-priority', priority);
  if (status)    await page.selectOption('#f-status', status);
  if (startDate) await page.fill('#f-start', startDate);
  if (workdays !== undefined) await page.fill('#f-workdays', String(workdays));
  if (alloc !== undefined)    await page.fill('#f-alloc', String(alloc));
  await page.locator('button:has-text("Save Task")').click();
}
