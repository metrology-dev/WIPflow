# WIP Flow — Agent Handoff

**Branch:** `master`
**Version:** 2.3
**Date:** 2026-06-06
**Status:** Shipped and merged.

---

## Current state

WIP Flow is a single-file offline-first HTML app (`WIPflow.html`). All code is inline — no build step. Open directly in a browser (Firefox primary, Chrome/Edge for file storage) to run. The file is ~5 800 lines.

The app is on version **2.3**. The backlog in `TODO.md` is clean — no open items.

---

## What shipped in v2.3

**File Storage refactor** — user-owned `tasks.json` with File System Access API.

Three new JS modules were added between `GlobalFilter` and `Storage`:

### `IDB`
IndexedDB helper. Persists `FileSystemDirectoryHandle` across browser sessions via `get/set/del(key)`. Used only by `FileSystemStorageProvider`.

### `FileSystemStorageProvider`
File System Access API wrapper.

- `supported` — `false` in Firefox; `true` in Chrome ≥ 86 / Edge ≥ 86
- `init()` — restores a stored handle from IDB, calls `requestPermission`. Returns `true` if ready.
- `chooseFolder()` — shows OS directory picker, persists handle in IDB. Returns `true` on success.
- `disconnect()` — removes handle from IDB.
- `load()` — reads and parses `tasks.json`. Returns `null` if file doesn't exist.
- `loadBackup()` — reads and parses `tasks.backup.json`. Returns `null` on any error.
- `save(json)` — write-safe: copies `tasks.json` → `tasks.backup.json`, then writes new `tasks.json`.
- `_readRaw / _writeRaw` — internal file handle helpers.
- `getFolderName()` — returns `_dirHandle.name` or `null`.

### `StorageManager`
Async startup orchestrator. **Runs before `App.init()`.**

- `init()` — async entry point called from boot. Tries FS, shows setup overlay if needed, falls back to localStorage. Registers page-lifecycle event hooks.
- `_loadFromFS()` — calls `FileSystemStorageProvider.load()`; falls back to backup or localStorage on failure.
- `_migrateLocalStorageToFS()` — copies localStorage data to `tasks.json` when a folder is first connected.
- `_loadFromLocalStorage()` — existing score-based logic (embedded data vs. localStorage; whichever has newer tasks wins).
- `_showSetup()` — returns a Promise that resolves when the user makes a choice in `#setup-overlay`.
- `_registerPageEvents()` — attaches `visibilitychange` (immediate save + external change check) and `beforeunload` (localStorage sync) handlers.
- `_checkExternalChange()` — on tab focus, compares `tasks.json` `lastModified` against `_lastSavedTime`; offers reload if externally changed.
- `_doSave(json)` — writes to localStorage (always), updates embedded `<script>` tag, writes to FS if active. Returns `true` on success.
- `isFileSystemActive()` — `true` when FS folder is connected and handle exists.
- `getFolderName()` — delegates to provider.
- `connectFolder()` / `disconnectFolder()` — called from `Settings`.

### Changed: `Storage`

- `save()` — now synchronous wrapper: serialises AppState, calls `StorageManager._doSave(json).then(...)` to update indicator. Fire-and-forget.
- `load()` — **removed**. Data is loaded by `StorageManager.init()` before `App.init()` runs.
- `markDirty()` — debounce changed 400 ms → 500 ms.
- `_setIndicator(ok, status)` — accepts `status` string (`'saving'`, `'saved'`, `'error'`, `'unsaved'`). Shows `📁 ` prefix when FS is active; red dot on `'error'`.

### Changed: `App.init()`

- Removed `Storage.load()` call. Seeds demo data only if `AppState.tasks.length === 0`.
- Shows a recovery toast (deferred from async startup) if `StorageManager._showRecoveryToast` is set.

### Changed: Boot

```js
// was: document.addEventListener('DOMContentLoaded', () => App.init());
document.addEventListener('DOMContentLoaded', async () => {
  await StorageManager.init();
  App.init();
});
```

### New HTML

- `#setup-overlay` — full-screen first-time setup card; hidden (`display:none`); shown by `StorageManager._showSetup()`. Has `#setup-choose-folder` and `#setup-use-browser` buttons.
- Settings → Storage card (`#storage-status-content`) — rendered by `Settings._renderStorageStatus()`.

### New Settings methods

- `_renderStorageStatus()` — populates `#storage-status-content`; adapts to FS active / inactive / not supported.
- `connectFolder()` / `disconnectFolder()` — async; call `StorageManager` then re-render.

---

## Architecture quick-reference

```
WIPflow.html (~5 800 lines)
│
├── CSS (lines ~10–1350)
├── HTML (lines ~1350–2470)
│   ├── #setup-overlay             NEW — first-time setup screen
│   ├── #toast-container
│   ├── #sidebar
│   │   ├── #sidebar-logo
│   │   ├── #sidebar-scroll-area → nav
│   │   │   ├── Views buttons
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
└── JS (lines ~2470–end)
    ├── DEFAULT_SETTINGS
    ├── WorkCalendar
    ├── AppState
    ├── grp()
    ├── GlobalFilter
    ├── IDB                        NEW — IndexedDB helper
    ├── FileSystemStorageProvider  NEW — File System Access API
    ├── StorageManager             NEW — async startup orchestrator
    ├── Storage
    ├── App
    ├── TaskModal
    ├── Dashboard
    ├── TableView
    ├── KanbanView
    ├── GanttFilters
    ├── Gantt
    ├── Settings                   +_renderStorageStatus, +connectFolder, +disconnectFolder
    ├── SidebarCalendar
    ├── Toast
    └── Report
```

---

## Conventions

- `escHtml()` — use for **all** user content in template strings, including `value="..."` attributes.
- `Storage.markDirty()` — at mutation sites (debounced 500 ms). `Storage.save()` for immediate writes.
- `GlobalFilter.selectedDate` is runtime-only — never written to `AppState.settings`.
- FS API (`showDirectoryPicker`) requires Chrome/Edge. Firefox gets localStorage fallback automatically.
- `StorageManager.init()` is async and must resolve before `App.init()` runs.
- After any fix: bump `APP_BASE_VERSION` MINOR, update Help/About in-app views, update `TODO.md`, commit.
- Stage only `WIPflow.html` and intentionally changed markdown files. Never commit `.labwip`, `.json`, CSV, or temp files.
- The `tasks.json` and `tasks.backup.json` files are user data — never commit them.

---

## If you pick this up next

No open TODO items. Possible future directions:

- Settings: "Clear browser localStorage backup" button for migrated users who want to clean up
- Settings: Show `tasks.json` file path or last-saved timestamp
- Conflict resolution when external changes are detected (merge instead of replace)
- Calendar click: "Open Task List" mode, task creation from calendar, date range selection
- Week / agenda view in the sidebar calendar
