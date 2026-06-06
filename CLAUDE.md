# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

WIP Flow is a single-file offline-first HTML application (`WIPflow.html`) for tracking laboratory work-in-progress. There is no build step, no package manager, no transpilation — all code is inline HTML/CSS/JS. Open the file directly in a browser to run it.

The app is branded **WIP Flow** (renamed from LabWIP in v1.2). The file is still named `WIPflow.html`.

## Development workflow

No build or lint commands exist. To develop:

1. Open `WIPflow.html` in a browser (Firefox is the primary target).
2. Edit the file and reload the browser tab.
3. The browser console is the only debugger.
4. A Python static server can be started with `python -m http.server 5500` for preview; `.claude/launch.json` configures it for the preview panel.

## Architecture

The entire application lives in `WIPflow.html` (~5 900 lines), structured as a sequence of named JS object modules. Execution order matters — modules are defined in dependency order and reference each other by name.

### Modules (in declaration order)

- **`DEFAULT_SETTINGS`** — Constant seed values for labs, persons, priorities, statuses, tags, `saveVersion`, and calendar settings (`calendarWeekNumbering`, `calendarFirstDay`, `calendarShowOutsideDays`).
- **`WorkCalendar`** — Date arithmetic: `isWorkday`, `calcEndDate(startStr, workdays, allocPct)`, `fmt`, `parse`. Skips weekends and holidays from `AppState.settings.holidays`.
- **`AppState`** — In-memory store: `tasks[]`, `settings{}`. CRUD via `saveTask(data)`, `deleteTask(id)`, `getTask(id)`, `getFilteredTasks(filters, sortCol, sortDir)`, serialised via `toJSON/fromJSON`. `getFilteredTasks` supports a `filters.selectedDate` (YYYY-MM-DD) to restrict results to tasks spanning that date.
- **`GlobalFilter`** — Shared runtime filter state: `selectedDate` (YYYY-MM-DD or null). `setDate(date)` toggles selection; `clearDate()` resets. Calls `SidebarCalendar.render()` and `App.refresh()` on every change. Not persisted to storage.
- **`IDB`** — IndexedDB helper. Persists `FileSystemDirectoryHandle` across sessions via `get/set/del(key)`.
- **`FileSystemStorageProvider`** — File System Access API storage provider. `init()` restores a stored handle; `chooseFolder()` shows the OS picker; `save(json)` backs up `tasks.json` → `tasks.backup.json` before writing; `load()` / `loadBackup()` read those files. `supported` is `false` in Firefox (no FSAPI).
- **`StorageManager`** — Async startup orchestrator. `init()` runs before `App.init()`: tries FS handle, shows first-time setup overlay if needed, falls back to localStorage. `_doSave(json)` writes to FS + localStorage. Registers `visibilitychange` / `beforeunload` hooks. `connectFolder()` / `disconnectFolder()` called from Settings.
- **`Storage`** — Persistence facade. `save()` delegates to `StorageManager._doSave()`; always keeps localStorage as safety net; updates the autosave indicator. `exportHTML()` / `exportFile()` / `exportCSV()` / `exportXLS()` unchanged. `markDirty()` debounces 500 ms. `load()` removed (data loaded by `StorageManager.init()` before `App.init()`).
- **`App`** — Lifecycle: `init()`, `refresh()`, `switchView(name)`, autosave timer. `refresh()` re-renders the active view and calls `SidebarCalendar.render()` — it does NOT call `markDirty()`.
- **`TaskModal`** — Create/edit dialog. `open(taskId?)` populates from `AppState.getTask`; `save()` captures `wasEdit` before `close()`, then calls `AppState.saveTask`, `Storage.markDirty()`, and `App.refresh()`.
- **`Dashboard`** — Canvas-based KPI charts. When `GlobalFilter.selectedDate` is set, filters the task list before computing KPIs and charts. Uses `ResizeObserver` to redraw on resize. Shows empty state (with appropriate message) when filtered task list is empty.
- **`TableView`** — Sortable/filterable `<table>`. Filters held in `TableView._filters`. `render()` merges `GlobalFilter.selectedDate` into filters on every call. Click a Status or Progress cell to edit inline without opening the modal (`editStatus`, `editProgress`).
- **`Gantt`** — Canvas timeline. Zoom levels: day/week/month. Task panel is sticky on horizontal scroll and resizable via a drag handle. When `GlobalFilter.selectedDate` is active, `_getFilteredTasks()` applies the date filter, `render()` auto-scrolls to the selected date, and `_drawBars()` draws an accent-coloured dashed guide line. Tooltip guard stored on `Gantt._tooltipBound` (not on the canvas element).
- **`GanttFilters`** — Filter state for the Gantt view.
- **`KanbanView`** — Kanban board with drag-and-drop. Equal-height columns. Each card has a "Move to…" status `<select>` for keyboard accessibility (`moveCard`). When `GlobalFilter.selectedDate` is active, `_getFilteredTasks()` applies the date filter. Shows empty state when filtered tasks = 0. `onDrop` and `moveCard` both call `Storage.markDirty()`.
- **`Settings`** — Editable dropdown lists, theme toggle, autosave interval, holiday calendar, calendar settings, group terminology, data management buttons.
- **`SidebarCalendar`** — Sidebar calendar component. State: `_year`, `_month`, `_collapsed`. `init()` seeds current month; `render()` draws the calendar grid with week numbers and activity dots into `#sidebar-calendar`; `navigate(delta)` steps months; `selectDate(dateStr)` delegates to `GlobalFilter.setDate()`. Dot colours derive from each task status's `activityCategory`: red = `problem`, green = `active`, outline = `planned`; `none` = no dot; max 3 per day. Week number algorithm supports ISO 8601 and US styles.
- **`Toast`** — Non-blocking notification toasts.
- **`Report`** — Print/export report dialog. Renders selected sections (KPI cards, charts, Gantt, task table, etc.) into a dedicated print container.

### Data flow for a save

```
mutation (saveTask / deleteTask / onDrop)
  └─► Storage.markDirty()                 ← debounced 500 ms
        └─► Storage.save()
              └─► StorageManager._doSave(json)
                    ├─► localStorage.setItem(STORAGE_KEY, json)   ← always (safety net)
                    ├─► <script id="labwip-embedded-data"> updated in DOM
                    └─► FileSystemStorageProvider.save(json)       ← if FS active
                          ├─► tasks.json → tasks.backup.json       ← backup first
                          └─► tasks.json ← new content

portable export:
  Storage.exportHTML()
    ├─► AppState.settings.saveVersion++
    └─► downloads WIPflow_vMAJOR.MINOR.SAVE.html

async startup:
  StorageManager.init()    ← runs BEFORE App.init()
    ├─► FileSystemStorageProvider.init()  ← restore IDB handle + request permission
    ├─► (or) show #setup-overlay          ← first-time in Chrome/Edge
    └─► (or) _loadFromLocalStorage()      ← fallback
```

Settings mutations (holiday add/remove, theme change, list edits) call `Storage.save()` directly since they need an immediate write.

### WorkCalendar end-date formula

```
calendarDays = ceil(workdays / (allocPct / 100))
```

Starting from `startDate` (counted as day 1 if it is a workday), walk forward skipping weekends and any date in `AppState.settings.holidays` (array of `"YYYY-MM-DD"` or `"YYYY-MM-DD Name"` strings) until `calendarDays` workdays have been counted.

## Versioning

Version format: `MAJOR.MINOR.SAVE`

- **MAJOR** — Developer edits `APP_BASE_VERSION`. Use for breaking changes or significant new features.
- **MINOR** — Developer edits `APP_BASE_VERSION`. Use for bug fixes and small improvements.
- **SAVE** — Incremented automatically each time the user clicks "Save as HTML".

`APP_BASE_VERSION` is a constant near the top of the JS section (e.g. `const APP_BASE_VERSION = '2.4';`).
`saveVersion` lives in `AppState.settings` and persists in localStorage and embedded data.

**Rule of thumb:** bump MINOR when shipping a fix or small feature; bump MAJOR for breaking changes.

## Data schema

`.labwip` files and `localStorage` both use the same JSON envelope:

```json
{
  "version": "1.0",
  "settings": {
    "theme": "dark",
    "autosaveIntervalMinutes": 5,
    "saveVersion": 0,
    "labs": [],
    "persons": [],
    "priorities": [],
    "statuses": [{"name":"Active","activityCategory":"active"}],
    "tags": [],
    "holidays": []
  },
  "tasks": [
    {
      "id": "task_...",
      "name": "", "lab": "", "person": "",
      "priority": "", "status": "",
      "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD",
      "workdays": 0, "alloc": 100, "progress": 0,
      "description": "", "tags": "", "notes": "",
      "created": "<ISO>", "modified": "<ISO>"
    }
  ]
}
```

`AppState.fromJSON` merges `DEFAULT_SETTINGS` with stored settings, so new setting keys added to `DEFAULT_SETTINGS` appear automatically for existing users.

## Key conventions

- **No classes** — all modules are plain object literals with underscore-prefixed private methods.
- **Canvas rendering** — Dashboard charts and Gantt timeline draw directly to `<canvas>` elements; they have no virtual DOM.
- **Inline HTML in JS** — views are rendered by assigning template-literal HTML strings to `el.innerHTML`. Always escape user content with `escHtml()` before interpolation, including `<option value="...">` attributes.
- **View switching** — `App.switchView(name)` toggles CSS visibility and calls the relevant `render()`. Only the active view is rendered on `App.refresh()`. Help and About are static — no render function needed.
- **`Storage.markDirty()` vs `Storage.save()`** — use `markDirty()` at mutation sites (debounced); use `save()` only for immediate writes (after import, settings changes, holiday edits). Never call `markDirty()` from pure re-renders.
- **Holiday changes** — call `App.refresh()` after `Storage.save()` whenever holidays are added/removed so all task end dates recalculate.
- **Theme changes** — call the relevant `render()` for the active canvas-based view (Dashboard, Gantt) and `KanbanView.render()` for Kanban in `Settings.setTheme()`.
- **GlobalFilter** — `GlobalFilter.selectedDate` is a runtime-only string (YYYY-MM-DD or null); it is never written to `AppState.settings` and never persisted. All views read it directly at render time. To trigger a filtered refresh, call `GlobalFilter.setDate(date)` or `GlobalFilter.clearDate()` — never call `App.refresh()` directly when changing the date filter.
- **`AppState.settings.statuses`** — now `{name, activityCategory}[]`, not a string array. `activityCategory` is one of `planned | active | problem | none`. Always use `.name` when you need the display string. `AppState.fromJSON` auto-migrates legacy string arrays on load. `VALID_ACTIVITY_CATEGORIES` is the authoritative list for validation. New statuses default to `activityCategory: 'none'`.

## Maintenance rules

### After any feature or bug fix

1. **Test in the preview panel** — use `/verify` or `/run` to open the app and exercise the changed path.
2. **Bump `APP_BASE_VERSION` MINOR** for fixes or small features (e.g. `'1.3'` → `'1.4'`). Bump MAJOR for breaking changes.
3. **Update the in-app Help view** (`#view-help`) if the change affects user-visible behaviour.
4. **Update the in-app About view** changelog section (`#view-about`) with a bullet under the new version.
5. **Update TODO.md** — mark completed items, add new backlog entries.
6. **Commit** with a descriptive message following the style of recent commits (`git log --oneline -5`).

### TODO.md usage

- Treat `TODO.md` as both a backlog of planned improvements and a completed log of shipped items.
- Completed items belong under `## ✅ Completed` with the version and fix described.
- New items go under priority sections (`🔴 Bugs`, `🟠 Improvements`, `🟡 UX`, etc.).
- Reference item numbers in commit messages when relevant.
- Use bullets, numbered lists, and code blocks in TODO.md. Only use tables for compact comparison data that genuinely benefits from tabular layout.

### Committing

- Stage only `WIPflow.html` and any markdown files that were intentionally changed.
- Never commit `.labwip` export files, temp files, or generated assets that are not part of the source.
- Commit message style: imperative subject line, body with bullet points for grouped changes.
- Add `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>` as a trailer.

### Documentation guidelines

All Markdown in this project should be readable in plain text editors as well as rendered viewers:

- Prefer hierarchical headings, bullets, numbered lists, definition-style sections, and code blocks over tables.
- Use tables only for compact comparison data or compatibility matrices where the tabular layout genuinely aids comprehension.
- Use Mermaid diagrams for workflows, processes, state machines, and architecture where the diagram is clearer than prose.
- Keep line lengths reasonable; avoid alignment whitespace.
- Use consistent heading hierarchy throughout the project.
- When documenting configuration, APIs, or data structures, prefer code blocks.
