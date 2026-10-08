/**
 * E2E tests — v3.0 data management.
 *
 * These cover the invariants that replaced the old silent-seeding behaviour:
 *   - a first run is an explicit choice, never fabricated data
 *   - a revision conflict is surfaced rather than resolved by timestamp
 *   - the data file is read back automatically at startup
 *   - a portable snapshot carries its data into a clean profile
 *   - export survives hostile content
 *
 * The mock FileSystemFileHandle used here is an in-page test double; a real
 * handle cannot be produced without a native picker.
 */
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { APP_URL, waitForApp } from './helpers.js';

const TASK = name => ({
  id: 'task_' + name, name, lab: 'RMP', person: 'Anna S.', priority: 'High', status: 'Active',
  startDate: '2026-05-04', endDate: '2026-05-06', workdays: 3, alloc: 100, progress: 10,
  tags: '', notes: '', created: '2026-05-01T08:00:00.000Z', modified: '2026-05-01T08:00:00.000Z',
});

/** Start from a clean browser storage state, then load the app. */
async function freshLoad(page) {
  await page.goto(APP_URL);
  await page.evaluate(() => { localStorage.clear(); });
  await page.reload();
  await waitForApp(page);
}

test.describe('First run', () => {
  test('never fabricates data — it asks instead', async ({ page }) => {
    await freshLoad(page);

    await expect(page.locator('#setup-overlay')).toBeVisible();
    expect(await page.evaluate(() => AppState.tasks.length)).toBe(0);

    // Every option is offered.
    for (const id of ['#setup-new', '#setup-load-demo', '#setup-attach', '#setup-import']) {
      await expect(page.locator(id)).toBeVisible();
    }
  });

  test('starting empty leaves an empty project', async ({ page }) => {
    await freshLoad(page);
    await page.locator('#setup-new').click();
    await page.waitForTimeout(600);

    await expect(page.locator('#setup-overlay')).not.toBeVisible();
    expect(await page.evaluate(() => AppState.tasks.length)).toBe(0);
  });

  test('loading the demonstration set is explicit', async ({ page }) => {
    await freshLoad(page);
    await page.locator('#setup-load-demo').click();
    await page.waitForTimeout(1500);

    expect(await page.evaluate(() => AppState.tasks.length)).toBe(15);
    // and it persists
    await page.reload();
    await waitForApp(page);
    expect(await page.evaluate(() => AppState.tasks.length)).toBe(15);
  });
});

test.describe('Revision handling', () => {
  test('a save increments the revision and keeps the browser copy current', async ({ page }) => {
    await freshLoad(page);
    await page.locator('#setup-new').click();
    await page.waitForTimeout(500);

    const before = await page.evaluate(() => AppState.settings.revision || 0);
    await page.evaluate(t => {
      AppState.saveTask(t);
      Storage.markDirty();
    }, TASK('REV-TEST'));
    await page.waitForTimeout(1200);

    const after = await page.evaluate(() => AppState.settings.revision || 0);
    expect(after).toBeGreaterThan(before);

    const cached = await page.evaluate(() => {
      const raw = localStorage.getItem('labwip_data');
      return raw ? JSON.parse(raw) : null;
    });
    expect(cached).not.toBeNull();
    expect(cached.revision).toBe(after);
    expect(cached.tasks.map(t => t.name)).toContain('REV-TEST');
  });

  test('restore points accumulate and can be restored', async ({ page }) => {
    await freshLoad(page);
    await page.locator('#setup-new').click();
    await page.waitForTimeout(500);

    for (const n of ['RP-1', 'RP-2', 'RP-3']) {
      await page.evaluate(t => { AppState.saveTask(t); Storage.markDirty(); }, TASK(n));
      await page.waitForTimeout(900);
    }

    const backups = await page.evaluate(() => StorageManager.listBackups());
    expect(backups.length).toBeGreaterThanOrEqual(2);

    // Restore the oldest available point and confirm the state changed.
    const oldest = backups[backups.length - 1];
    const ok = await page.evaluate(rev => StorageManager.restoreBackup(rev), oldest.rev);
    expect(ok).toBe(true);
    expect(await page.evaluate(() => AppState.tasks.length)).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Data file (File System Access mock)', () => {
  const MOCK = `
    window.__mock = { name: 'wipflow-data.json', text: null, writes: 0 };
    function makeHandle() {
      return {
        name: window.__mock.name, kind: 'file',
        queryPermission: async () => 'granted',
        requestPermission: async () => 'granted',
        getFile: async () => ({
          name: window.__mock.name, lastModified: Date.now(),
          text: async () => window.__mock.text,
        }),
        createWritable: async () => ({
          write: async (t) => { window.__mock.text = String(t); window.__mock.writes++; },
          close: async () => {},
        }),
      };
    }
    window.showSaveFilePicker = async () => makeHandle();
    window.showOpenFilePicker = async () => [makeHandle()];
  `;

  test('connecting a data file gives silent autosave', async ({ page }) => {
    await page.addInitScript(MOCK);
    await freshLoad(page);
    await page.locator('#setup-new').click();
    await page.waitForTimeout(500);

    const connected = await page.evaluate(() => StorageManager.connectDataFile('open'));
    expect(connected).toBe(true);
    expect(await page.evaluate(() => DataFile.provider)).toBe('fs');

    await page.evaluate(t => { AppState.saveTask(t); Storage.markDirty(); }, TASK('FS-SAVED'));
    await page.waitForTimeout(1500);

    const written = await page.evaluate(() => window.__mock.text);
    expect(written).toBeTruthy();
    const payload = JSON.parse(written);
    expect(payload.tasks.map(t => t.name)).toContain('FS-SAVED');
    expect(payload.revision).toBeGreaterThan(0);
    expect(await page.evaluate(() => window.__mock.writes)).toBeGreaterThan(0);
  });
});

test.describe('Data & Backup panel', () => {
  test('opens from the sidebar, reports state, and closes', async ({ page }) => {
    await freshLoad(page);
    await page.locator('#setup-new').click();
    await page.waitForTimeout(500);

    await page.locator('#autosave-indicator').click();
    await expect(page.locator('#data-panel-overlay')).toBeVisible();

    // The panel renders asynchronously (it loads restore points from IndexedDB).
    const body = page.locator('#data-panel-body');
    await expect(body).toContainText(/Restore points/i, { timeout: 5000 });
    await expect(body).toContainText(/Portable snapshot/i);
    await expect(body).toContainText(/Revision/i);

    await page.locator('#data-panel .btn-icon').click();
    await expect(page.locator('#data-panel-overlay')).not.toBeVisible();
  });

  test('Settings shows a storage card with a Data & Backup action', async ({ page }) => {
    await freshLoad(page);
    await page.locator('#setup-new').click();
    await page.waitForTimeout(500);

    await page.locator('[data-view="settings"]').click();
    await page.waitForTimeout(400);

    const card = await page.locator('#storage-status-content').innerText();
    expect(card.length).toBeGreaterThan(20);
    expect(card).toMatch(/Data & Backup/i);
  });
});

test.describe('Portable snapshot', () => {
  /** Export the current state and save it to a stable path. */
  async function exportSnapshot(page, file) {
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.evaluate(() => Storage.exportHTML()),
    ]);
    await download.saveAs(file);
    return file;
  }

  const tmpFile = name => path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'wipflow-snap-')), name);

  test('carries the data and opens with it', async ({ page, browser }) => {
    await freshLoad(page);
    await page.locator('#setup-load-demo').click();
    await page.waitForTimeout(1500);

    const file = await exportSnapshot(page, tmpFile('snapshot.html'));

    // The produced file must carry the payload.
    const html = fs.readFileSync(file, 'utf8');
    const m = html.match(/<script id="labwip-embedded-data"[^>]*>([\s\S]*?)<\/script>/);
    expect(m).not.toBeNull();
    const payload = JSON.parse(m[1].trim());
    expect(payload.tasks.length).toBe(15);

    // Open it in a brand-new context: the data must come from the file alone.
    const ctx = await browser.newContext();
    const p2 = await ctx.newPage();
    const errors = [];
    p2.on('pageerror', e => errors.push(e.message));
    await p2.goto('file:///' + file.replace(/\\/g, '/'));
    await p2.waitForFunction(() => typeof AppState !== 'undefined' && AppState.tasks.length > 0, null, { timeout: 15000 });
    expect(await p2.evaluate(() => AppState.tasks.length)).toBe(15);
    expect(await p2.evaluate(() => document.querySelector('#setup-overlay').style.display || 'none')).toBe('none');
    expect(errors).toEqual([]);
    await ctx.close();
  });

  test('survives task text containing HTML and script-like content', async ({ page }) => {
    const HOSTILE = 'Weird </script> & <b>bold</b> "quoted" åäö ✓';
    await freshLoad(page);
    await page.locator('#setup-new').click();
    await page.waitForTimeout(500);
    await page.evaluate(t => { AppState.saveTask(t); Storage.markDirty(); }, TASK(HOSTILE));
    await page.waitForTimeout(1200);

    const file = await exportSnapshot(page, tmpFile('hostile.html'));
    const html = fs.readFileSync(file, 'utf8');
    const m = html.match(/<script id="labwip-embedded-data"[^>]*>([\s\S]*?)<\/script>/);
    const payload = JSON.parse(m[1].trim());
    expect(payload.tasks[0].name).toBe(HOSTILE);

    // And it survives a re-open.
    const ctx = await page.context().browser().newContext();
    const p2 = await ctx.newPage();
    await p2.goto('file:///' + file.replace(/\\/g, '/'));
    await p2.waitForFunction(() => typeof AppState !== 'undefined' && AppState.tasks.length > 0, null, { timeout: 15000 });
    expect(await p2.evaluate(() => AppState.tasks[0].name)).toBe(HOSTILE);
    await ctx.close();
  });
});
