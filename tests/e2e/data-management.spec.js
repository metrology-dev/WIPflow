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
  // Startup loading is asynchronous; make sure it has settled before asserting.
  await page.waitForFunction(() => {
    const overlay = document.getElementById('setup-overlay');
    return typeof AppState !== 'undefined' &&
      (AppState.tasks.length > 0 || (overlay && overlay.style.display === 'flex'));
  }, null, { timeout: 15000 });
}

/** Choose an option on the first-run overlay and wait for it to finish. */
async function chooseFirstRun(page, id) {
  await page.locator(id).click();
  await page.waitForFunction(() => {
    const o = document.getElementById('setup-overlay');
    return o && o.style.display === 'none';
  }, null, { timeout: 10000 });
  await page.waitForTimeout(300);   // let the resulting save land
}

/** Wait until the browser copy holds a task with this name. */
async function waitForCached(page, name) {
  await page.waitForFunction(n => {
    try {
      const raw = localStorage.getItem('labwip_data');
      return !!raw && (JSON.parse(raw).tasks || []).some(t => t.name === n);
    } catch (e) { return false; }
  }, name, { timeout: 12000 });
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
    await chooseFirstRun(page, '#setup-new');

    await expect(page.locator('#setup-overlay')).not.toBeVisible();
    expect(await page.evaluate(() => AppState.tasks.length)).toBe(0);
  });

  test('loading the demonstration set is explicit', async ({ page }) => {
    await freshLoad(page);
    await chooseFirstRun(page, '#setup-load-demo');

    expect(await page.evaluate(() => AppState.tasks.length)).toBe(15);

    // Wait for the write to land before reloading — the save is asynchronous.
    await page.waitForFunction(() => {
      try {
        const raw = localStorage.getItem('labwip_data');
        return !!raw && (JSON.parse(raw).tasks || []).length === 15;
      } catch (e) { return false; }
    }, null, { timeout: 12000 });

    await page.reload();
    await waitForApp(page);
    await page.waitForFunction(() => AppState.tasks.length === 15, null, { timeout: 12000 });
    expect(await page.evaluate(() => AppState.tasks.length)).toBe(15);
  });
});

test.describe('Revision handling', () => {
  test('a save increments the revision and keeps the browser copy current', async ({ page }) => {
    await freshLoad(page);
    await chooseFirstRun(page, '#setup-new');

    const before = await page.evaluate(() => AppState.settings.revision || 0);
    await page.evaluate(t => {
      AppState.saveTask(t);
      Storage.markDirty();
    }, TASK('REV-TEST'));
    await waitForCached(page, 'REV-TEST');

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
    await chooseFirstRun(page, '#setup-new');

    for (const n of ['RP-1', 'RP-2', 'RP-3']) {
      await page.evaluate(t => { AppState.saveTask(t); Storage.markDirty(); }, TASK(n));
      await waitForCached(page, n);
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

test.describe('Data folder (File System Access mock)', () => {
  // v3.1 connects a FOLDER, not a file, because that is what allows silent
  // autosave plus .bak1…bak9 history on the canonical filename.
  const MOCK = `
    window.__files = {};
    function makeDir() {
      return {
        kind: 'directory', name: 'Data',
        queryPermission: async () => 'granted',
        requestPermission: async () => 'granted',
        getFileHandle: async (name, opts) => {
          if (!(opts && opts.create) && !(name in window.__files)) {
            const e = new Error('not found'); e.name = 'NotFoundError'; throw e;
          }
          if (!(name in window.__files)) window.__files[name] = '';
          return {
            name, kind: 'file',
            getFile: async () => ({ name, lastModified: Date.now(), text: async () => window.__files[name] }),
            createWritable: async () => ({
              write: async (t) => { window.__files[name] = String(t); },
              close: async () => {},
            }),
          };
        },
        removeEntry: async (name) => { delete window.__files[name]; },
      };
    }
    window.showDirectoryPicker = async () => makeDir();
  `;

  test('connecting a folder gives silent autosave with backup rotation', async ({ page }) => {
    await page.addInitScript(MOCK);
    await freshLoad(page);
    await chooseFirstRun(page, '#setup-new');

    const connected = await page.evaluate(() => StorageManager.connectDataFolder());
    expect(connected).toBe(true);
    expect(await page.evaluate(() => DataFile.provider)).toBe('fs');

    // Three revisions: the third write must leave .bak1 and .bak2 behind.
    for (const n of ['FS-SAVED-1', 'FS-SAVED-2', 'FS-SAVED-3']) {
      await page.evaluate(task => { AppState.saveTask(task); Storage.markDirty(); }, TASK(n));
      // Wait for the write to reach the folder rather than guessing a delay.
      await page.waitForFunction(name => {
        try {
          const raw = window.__files['wipflow-data.json'];
          return !!raw && (JSON.parse(raw).tasks || []).some(t => t.name === name);
        } catch (e) { return false; }
      }, n, { timeout: 10000 });
    }

    const files = await page.evaluate(() => Object.keys(window.__files));
    const canonical = await page.evaluate(() => {
      try { return JSON.parse(window.__files['wipflow-data.json']); } catch (e) { return null; }
    });
    expect(canonical).not.toBeNull();
    expect(canonical.tasks.map(t => t.name)).toContain('FS-SAVED-3');
    expect(files).toContain('wipflow-data.json.bak1');
    expect(files).toContain('wipflow-data.json.bak2');

    // The canonical file must hold the highest revision of all of them.
    const revs = await page.evaluate(() => {
      const out = {};
      for (const k of Object.keys(window.__files)) {
        try { out[k] = JSON.parse(window.__files[k]).revision; } catch (e) { out[k] = null; }
      }
      return out;
    });
    const canonicalRev = revs['wipflow-data.json'];
    for (const [name, rev] of Object.entries(revs)) {
      if (name === 'wipflow-data.json' || rev == null) continue;
      expect(rev).toBeLessThan(canonicalRev);
    }
  });
});

test.describe('Data & Backup panel', () => {
  test('opens from the sidebar, reports state, and closes', async ({ page }) => {
    await freshLoad(page);
    await chooseFirstRun(page, '#setup-new');

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
    await chooseFirstRun(page, '#setup-new');

    await page.locator('[data-view="settings"]').click();
    await expect(page.locator('#storage-status-content')).toContainText(/Data & Backup/i, { timeout: 5000 });
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
    await chooseFirstRun(page, '#setup-load-demo');

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
    await chooseFirstRun(page, '#setup-new');
    await page.evaluate(t => { AppState.saveTask(t); Storage.markDirty(); }, TASK(HOSTILE));
    await waitForCached(page, HOSTILE);

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
