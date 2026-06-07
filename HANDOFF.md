# WIP Flow — Agent Handoff

**Branch:** `master`
**Version:** 2.5
**Date:** 2026-06-07
**Status:** Shipped and merged.

---

## Current state

WIP Flow is a single-file offline-first HTML app (`WIPflow.html`). All code is inline — no build step. Open directly in a browser (Firefox primary, Chrome/Edge for file storage) to run. The file is ~5 920 lines.

The app is on version **2.5**. A full automated testing infrastructure was added in this session. The `TODO.md` backlog is clean — no open items.

---

## What shipped in v2.5

**Automated testing infrastructure** — Vitest unit/integration tests + Playwright E2E tests.

### Summary

- **108 unit + integration tests** (Vitest, ~300 ms): business logic, migrations, filter logic, fixture loading
- **25 E2E tests** (Playwright Chromium): task workflows, settings, calendar filtering, localStorage persistence
- **Golden dataset**: `tests/fixtures/golden-project.wipflow` — 143 realistic tasks, all categories, all filters exercised
- **Legacy migration fixtures**: `legacy-v1.wipflow` (string statuses), `legacy-v2.wipflow` (partial/invalid objects)
- **vm-based test setup**: `tests/setup/wipflow-env.js` loads production code from `WIPflow.html` at test time — no code duplication, no separate build step

### Run commands

```bash
npm test            # unit + integration (Vitest, ~300 ms)
npm run test:e2e    # E2E (Playwright Chromium, ~30 s, requires Python HTTP server on :5501)
npm run test:all    # both
```

### Directory structure

```
package.json              – npm deps (vitest, playwright)
vitest.config.js          – Vitest configuration
playwright.config.js      – Playwright configuration (webServer: python -m http.server 5501)
tests/
  setup/
    wipflow-env.js        – vm-based WIPflow.html loader; exposes all modules on globalThis
  unit/
    work-calendar.test.js – WorkCalendar pure date-math tests (37 tests)
    app-state.test.js     – AppState CRUD, serialisation, filter tests (39 tests)
    migration.test.js     – migrateStatusCategory, fromJSON migration tests (32 tests)
  integration/
    fixtures.test.js      – Loads all three fixture files, verifies data integrity
  e2e/
    helpers.js            – Shared selectors/helpers (DOM IDs derived from WIPflow.html)
    task-management.spec.js – Task create/edit/delete, end-date calc, Escape key
    settings.spec.js      – View navigation, theme, status list, calendar settings
    calendar-filter.spec.js – Calendar render, navigation, date filter activation
    persistence.spec.js   – localStorage round-trip across page reload
  fixtures/
    golden-project.wipflow    – 143-task realistic golden dataset
    legacy-v1.wipflow         – v1.x format: plain string statuses
    legacy-v2.wipflow         – v2.x format: partial/invalid activityCategory objects
    generate-golden.mjs       – Generator script (not a test; run manually if dataset needs regeneration)
```

### Key technical notes for tests

- **vm-based loader**: reads `WIPflow.html`, extracts the main `<script>` tag, transforms `^const/let ` → `^var ` (top-level only via `^` + multiline), strips the `DOMContentLoaded` boot listener, runs via `vm.Script.runInContext`. Since `var` at top level in a vm script becomes a property of the context, all modules are accessible via `sandbox.WorkCalendar` etc., then promoted to `globalThis` so Vitest tests can use them without imports.
- **DOM stubs**: the sandbox includes lightweight stubs for `document`, `localStorage`, `indexedDB`, `window.addEventListener`, etc. Module *methods* reference DOM lazily (inside method bodies), not at definition time — only the sandbox stubs matter.
- **E2E selectors** (key mappings from WIPflow.html):
  - Nav buttons: `[data-view="dashboard"]` etc.
  - Modal: `#modal-overlay` (class `open` when visible), fields: `#f-name`, `#f-lab`, `#f-person`, `#f-priority`, `#f-status`, `#f-start`, `#f-workdays`, `#f-alloc`, `#f-enddate`
  - Save: `button:has-text("Save Task")`; Delete: `#modal-delete-btn`
  - Calendar: `.cal-nav-btn` (prev/next), `.cal-today-btn`, `.cal-month-title`
  - Date filter bar: `#date-filter-bar`
  - Theme: `#theme-dark`, `#theme-light`
  - Status list: `#list-statuses`

### Testing conventions (for all future changes)

1. Run `npm test` before every commit.
2. Run `npm run test:e2e` before every release.
3. Every bug fix must add a regression test in the appropriate `tests/unit/` or `tests/integration/` file.
4. Every new feature must add unit tests and, for user-visible features, at least one E2E test.
5. Never skip or disable failing tests — fix the root cause.

---

## What shipped in v2.4

**Calendar activity categories** — calendar dot rendering decoupled from status names.

### Data model change

`AppState.settings.statuses` changed from a plain string array to an object array:

```js
{ name: 'Active', activityCategory: 'active' }
```

`activityCategory` is one of four stable system values: `planned`, `active`, `problem`, `none`.

### New constants / helpers (before `resolveColor`)

- `ACTIVITY_CATEGORIES` — object keyed by category value; each entry has `label` and `dot` fields.
- `VALID_ACTIVITY_CATEGORIES` — `Object.keys(ACTIVITY_CATEGORIES)` for validation.
- `migrateStatusCategory(name)` — case-insensitive name→category lookup with `'none'` fallback.

### Migration in `AppState.fromJSON`

After merging settings, statuses are normalised:
- String entries → `{ name, activityCategory: migrateStatusCategory(name) }`
- Object entries missing or invalid `activityCategory` → category inferred from name

Runs automatically on every load. No user action required. No data is lost.

### `SidebarCalendar._computeDots`

Builds a `Map(statusName → activityCategory)` from `AppState.settings.statuses` once per render, then counts `active / planned / problem` by looking up each task's status. Zero hard-coded status names remain in calendar logic.

### `SidebarCalendar.render` tooltip

Aggregates by category: `"N Problem tasks / N Active tasks / N Planned tasks"` — status names are not exposed.

### Settings changes

- `Settings.render()` calls `_renderStatusList('list-statuses', s.statuses)` instead of the generic `_renderList`.
- New `Settings._renderStatusList(containerId, statuses)` — renders each status with an inline Activity Category `<select>` dropdown.
- New `Settings.setStatusCategory(idx, category)` — validates category, saves to `AppState.settings.statuses[idx].activityCategory`, calls `Storage.save()` and `SidebarCalendar.render()`.
- `Settings.addItem('statuses')` pushes `{ name: val, activityCategory: 'none' }` instead of a string; duplicate check uses `.some(s => s.name === val)`.

### Callers updated to use `.name`

All code that previously iterated `AppState.settings.statuses` as strings now extracts `.name`:

- `TaskModal.open()` — `AppState.settings.statuses.map(s => s.name)` passed to `_populateSelect`
- `TableView.render()` — `setOpts('filter-status', ...)` receives `.map(s => s.name)`
- `TableView.editStatus()` — iterates objects, uses `s.name` for value/text/selected
- `KanbanView.render()` — iterates objects as `statusObj`, uses `statusObj.name`
- `KanbanView._cardHtml()` — status options map uses `s.name`
- `GanttFilters.render()` — `setOpts('gantt-filter-status', ...)` receives `.map(s => s.name)`

---

## Architecture quick-reference

```
WIPflow.html (~5 920 lines)
│
├── CSS (lines ~10–1350)
├── HTML (lines ~1350–2490)
│   ├── #setup-overlay             — first-time setup screen
│   ├── #toast-container
│   ├── #sidebar
│   │   ├── #sidebar-logo
│   │   ├── #sidebar-scroll-area → nav
│   │   │   ├── Views buttons      [data-view="..."]
│   │   │   ├── [divider]
│   │   │   ├── #sidebar-calendar-section
│   │   │   ├── [divider]
│   │   │   └── Manage / Support buttons
│   │   └── #sidebar-footer (autosave indicator)
│   └── #main
│       ├── header#topbar
│       ├── #date-filter-bar
│       └── #view-area (dashboard / table / gantt / kanban / settings / help / about)
│
└── JS (lines ~2490–end)
    ├── DEFAULT_SETTINGS           statuses now [{name, activityCategory}] objects
    ├── ACTIVITY_CATEGORIES        NEW in v2.4 — stable system-defined dot categories
    ├── migrateStatusCategory()    NEW in v2.4 — name→category legacy migration helper
    ├── WorkCalendar
    ├── AppState                   fromJSON migrates legacy string statuses
    ├── grp()
    ├── GlobalFilter
    ├── IDB
    ├── FileSystemStorageProvider
    ├── StorageManager
    ├── Storage
    ├── App
    ├── TaskModal
    ├── Dashboard
    ├── TableView
    ├── KanbanView
    ├── GanttFilters
    ├── Gantt
    ├── Settings                   +_renderStatusList, +setStatusCategory, updated addItem
    ├── SidebarCalendar            _computeDots uses activityCategory Map
    ├── Toast
    └── Report
```

---

## Conventions

- `escHtml()` — use for **all** user content in template strings, including `value="..."` attributes.
- `Storage.markDirty()` — at mutation sites (debounced 500 ms). `Storage.save()` for immediate writes.
- `GlobalFilter.selectedDate` is runtime-only — never written to `AppState.settings`.
- `AppState.settings.statuses` is now `{name, activityCategory}[]`. Always use `.name` when you need the string; never compare by index.
- `VALID_ACTIVITY_CATEGORIES` — validate before storing any activityCategory value.
- FS API (`showDirectoryPicker`) requires Chrome/Edge. Firefox gets localStorage fallback automatically.
- `StorageManager.init()` is async and must resolve before `App.init()` runs.
- After any fix: bump `APP_BASE_VERSION` MINOR, update Help/About in-app views, update `TODO.md`, run `npm test`, commit.
- Stage only `WIPflow.html`, markdown files, and test files that were intentionally changed. Never commit `.labwip`, `.json`, CSV, or temp files. Never commit `node_modules/` or `test-results/`.
- The `tasks.json` and `tasks.backup.json` files are user data — never commit them.

---

## If you pick this up next

No open TODO items. Possible future directions (in `TODO.md`):

- Settings: "Clear browser localStorage backup" button for migrated users
- Settings: Show `tasks.json` file path or last-saved timestamp
- Conflict resolution when external changes are detected (merge instead of replace)
- Calendar: task creation from calendar, date range selection
- Week / agenda view in the sidebar calendar
- Status color: user-configurable colors per status
- E2E tests: add Firefox project to Playwright config
