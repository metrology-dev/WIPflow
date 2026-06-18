# WIP Flow — Architecture

WIP Flow is a single-file, offline-first HTML application. The entire application lives in `WIPflow.html` (~5 900 lines of inline HTML, CSS, and JavaScript). There is no build step, no package manager, and no transpilation.

---

## File Structure

```
WIPflow.html           # The entire application — HTML, CSS, and JS in one file
README.md              # User-facing documentation for GitHub
CLAUDE.md              # Architecture notes and conventions for AI-assisted development
TODO.md                # Backlog and completed change log
HANDOFF.md             # Context for handing off development across sessions
LICENSE                # GPL-3.0 license text
package.json           # Dev dependencies and test scripts (no runtime dependencies)
vitest.config.js       # Vitest config for unit/integration tests
playwright.config.js   # Playwright config for end-to-end tests
docs/
  ARCHITECTURE.md      # This file — module map and data flow reference
  DATA_SCHEMA.md       # Task and settings JSON schema reference
Icons/
  WIPFlow_logo_new_small.png   # App logo (embedded as base64 in WIPflow.html)
  WIPFlow_logo_new.svg         # Source SVG for the logo
tests/
  setup/wipflow-env.js         # vm-based loader that extracts <script> from WIPflow.html for tests
  unit/                        # Unit tests (AppState, WorkCalendar, migration)
  integration/                 # Fixture round-trip tests
  fixtures/                    # Golden and legacy .wipflow files used by tests
  e2e/                         # Playwright browser tests
```

---

## Internal Structure of WIPflow.html

The file is structured as three sections, in order:

```
<head>
  metadata, favicon, Inter + IBM Plex Mono font imports
<style>
  ~1 290 lines of CSS (CSS custom properties → layout → components → views)
<body>
  #sidebar
    #sidebar-logo
    #sidebar-scroll-area → nav#sidebar-nav (Views, Calendar, Manage)
    #sidebar-footer
  #main
    header#topbar
    #date-filter-bar   (hidden unless GlobalFilter.selectedDate is set)
    #view-area
      #view-dashboard
      #view-table
      #view-gantt
      #view-kanban
      #view-settings
      #view-help
      #view-about
<script>
  ~3 200 lines of JS — module object literals in dependency order
```

---

## JS Modules (declaration order)

Modules are plain object literals with underscore-prefixed private methods. Order matters — each module may reference modules declared above it.

| Module | Responsibility |
|--------|---------------|
| `DEFAULT_SETTINGS` | Constant seed values for labs, persons, priorities, statuses (as `{name, activityCategory}[]`), tags, `saveVersion`, and calendar settings |
| `ACTIVITY_CATEGORIES` | Constant object keyed by category (`planned`, `active`, `problem`, `none`); each entry has `label` and `dot` fields. Single authoritative source for valid category values |
| `migrateStatusCategory(name)` | Helper — maps a legacy status name to its `activityCategory` using case-insensitive lookup; returns `'none'` for unknown names |
| `WorkCalendar` | Date arithmetic: `isWorkday`, `calcEndDate(startStr, workdays, allocPct)`, `fmt`, `parse`. Skips weekends and configured holidays |
| `AppState` | In-memory store: `tasks[]`, `settings{}`. CRUD via `saveTask`, `deleteTask`, `getTask`, `getFilteredTasks`. `fromJSON` auto-migrates legacy string statuses. Serialised via `toJSON/fromJSON` |
| `grp(plural)` | Helper function — reads `AppState.settings.groupSingular/groupPlural` and returns the correct label |
| `GlobalFilter` | Runtime-only shared filter state: `selectedDate` (YYYY-MM-DD or null). `setDate` / `clearDate` trigger `SidebarCalendar.render()` and `App.refresh()`. Never persisted |
| `IDB` | IndexedDB helper — `get/set/del(key)`. Persists `FileSystemDirectoryHandle` across browser sessions |
| `FileSystemStorageProvider` | File System Access API wrapper. `chooseFolder`, `load`, `save` (write-safe: backup before write), `loadBackup`, `disconnect`. `supported` is `false` in Firefox |
| `StorageManager` | Async startup orchestrator. Runs before `App.init()`. Handles provider selection, first-time setup overlay, localStorage migration, external-change detection, and page-lifecycle save hooks |
| `Storage` | Persistence facade: `save()` delegates to `StorageManager._doSave()`; `exportHTML()`, `exportFile()`, `exportCSV()`, `exportXLS()`, `markDirty()` (debounced 500 ms). `load()` removed — loading handled by `StorageManager.init()` |
| `App` | Lifecycle: `init()`, `refresh()`, `switchView(name)`, autosave timer |
| `TaskModal` | Create/edit task dialog |
| `Dashboard` | Canvas-based KPI cards and bar charts. Respects `GlobalFilter.selectedDate` |
| `TableView` | Sortable/filterable table. Merges `GlobalFilter.selectedDate` on every render |
| `KanbanView` | Kanban board with drag-and-drop. Respects `GlobalFilter.selectedDate` |
| `GanttFilters` | Filter state for the Gantt view |
| `Gantt` | Canvas timeline with zoom levels. Auto-scrolls and draws guide line when date filter is active |
| `Settings` | Settings page rendering and mutation handlers. `_renderStatusList` renders status rows with Activity Category dropdowns; `setStatusCategory` updates and re-saves |
| `SidebarCalendar` | Sidebar calendar component with activity dots and date selection. `_computeDots` looks up each task status's `activityCategory` via a `Map`; no hard-coded status names |
| `Toast` | Non-blocking notification toasts |
| `Report` | Print/export report dialog |

---

## Data Flow

### Save on mutation

```
user action (TaskModal.save / KanbanView.onDrop / TableView inline edit)
  └─► Storage.markDirty()                 ← debounced 500 ms
        └─► Storage.save()
              └─► StorageManager._doSave(json)
                    ├─► localStorage.setItem(STORAGE_KEY, json)   ← always (safety net)
                    ├─► <script id="labwip-embedded-data"> updated in DOM
                    └─► FileSystemStorageProvider.save(json)       ← if folder connected
                          ├─► tasks.json → tasks.backup.json       ← backup first
                          └─► tasks.json ← new content
```

Settings mutations (holiday add/remove, theme change, list edits) call `Storage.save()` directly for an immediate write.

### Async startup

```
DOMContentLoaded (async)
  └─► StorageManager.init()       ← runs BEFORE App.init()
        ├─► FileSystemStorageProvider.init()   ← restore IDB handle + request permission
        │     └─► load tasks.json → AppState
        ├─► (or) show #setup-overlay           ← first launch in Chrome/Edge
        └─► (or) _loadFromLocalStorage()       ← Firefox or no folder connected
              └─► AppState.fromJSON(winner)
  └─► App.init()
```

### Portable export

```
Storage.exportHTML()
  ├─► AppState.settings.saveVersion++
  └─► downloads WIPflow_vMAJOR.MINOR.SAVE.html (self-contained with embedded data)
```

### View rendering

```
App.refresh()
  ├─► renders the active view (Dashboard / Table / Gantt / Kanban)
  └─► calls SidebarCalendar.render()

GlobalFilter.setDate(date) / GlobalFilter.clearDate()
  ├─► updates GlobalFilter.selectedDate
  ├─► calls SidebarCalendar.render()
  └─► calls App.refresh()           ← all views re-read the filter at render time
```

---

## Key Conventions

- **No classes** — all modules are plain object literals.
- **Canvas rendering** — Dashboard charts and Gantt draw directly to `<canvas>`; no virtual DOM.
- **Inline HTML** — views assign template-literal strings to `el.innerHTML`. Always escape user content with `escHtml()`.
- **`markDirty()` vs `save()`** — use `markDirty()` at mutation sites; `save()` only for immediate writes.
- **`GlobalFilter.selectedDate`** is runtime-only — never write to `AppState.settings` and never persist.
- **`AppState.settings.statuses`** — `{name, activityCategory}[]` since v2.4. Always use `.name` when you need the display string. `VALID_ACTIVITY_CATEGORIES` is the authoritative validation list. `migrateStatusCategory()` handles legacy string entries automatically in `fromJSON`.
- **Holiday changes** — call `App.refresh()` after `Storage.save()` so all end dates recalculate.
- **Theme changes** — call `render()` for canvas-based views (Dashboard, Gantt) and `KanbanView.render()` in `Settings.setTheme()`.

---

## Testing (since v2.5)

Tests run against the production code in `WIPflow.html` directly — there is no separate build or duplicated module source.

```
tests/setup/wipflow-env.js
  ├─► reads WIPflow.html, extracts the main <script> contents
  ├─► rewrites top-level const/let to var so each module becomes a vm context property
  └─► runs the rewritten script in a Node `vm` context, exposing all modules on globalThis
```

- **Unit/integration** (`npm test`) — Vitest, covers `AppState`, `WorkCalendar`, status migration, and fixture round-trips against `tests/fixtures/*.wipflow`.
- **End-to-end** (`npm run test:e2e`) — Playwright, drives the app in a real browser (calendar filtering, persistence, settings, task management).
- Fixtures (`golden-project.wipflow`, `legacy-v1.wipflow`, `legacy-v2.wipflow`) use synthetic data only — never real task data.

---

## WorkCalendar End-Date Formula

```
calendarDays = ⌈ workdays ÷ (allocPct ÷ 100) ⌉
```

Starting from `startDate` (counted as day 1 if it is a workday), walk forward skipping weekends and any date in `AppState.settings.holidays` (array of `"YYYY-MM-DD"` or `"YYYY-MM-DD Name"` strings) until `calendarDays` workdays have been counted.

---

## Versioning

Format: `MAJOR.MINOR.SAVE`

- **MAJOR** — bump for breaking changes or significant new features.
- **MINOR** — bump for bug fixes and small improvements.
- **SAVE** — auto-incremented each time the user clicks **↓ Save as HTML**.

`APP_BASE_VERSION` is a constant near the top of the `<script>` section. `saveVersion` lives in `AppState.settings` and persists with the data.
