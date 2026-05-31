# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

WIP Flow is a single-file offline-first HTML application (`WIPflow.html`) for tracking laboratory work-in-progress. There is no build step, no package manager, no transpilation — all code is inline HTML/CSS/JS. Open the file directly in a browser to run it.

The app is branded **WIP Flow** (renamed from LabWIP in v1.2). The file is still named `WIPflow.html`.

## Development workflow

No build or lint commands exist. To develop:
- Open `WIPflow.html` in a browser (Firefox is the primary target).
- Edit the file and reload the browser tab.
- The browser console is the only debugger.
- A Python static server can be started with `python -m http.server 5500` for preview; `.claude/launch.json` configures it for the preview panel.

## Architecture

The entire application lives in `WIPflow.html` (~3 600 lines), structured as a sequence of named JS object modules. Execution order matters — modules are defined in dependency order and reference each other by name.

**Module map (in declaration order):**

| Module | Role |
|---|---|
| `DEFAULT_SETTINGS` | Constant — seed values for labs, persons, priorities, statuses, tags, `saveVersion` |
| `WorkCalendar` | Date arithmetic: `isWorkday`, `calcEndDate(startStr, workdays, allocPct)`, `fmt`, `parse`. Skips weekends and holidays from `AppState.settings.holidays`. |
| `AppState` | In-memory store: `tasks[]`, `settings{}`. CRUD via `saveTask(data)`, `deleteTask(id)`, `getTask(id)`, `getFilteredTasks(filters, sortCol, sortDir)`, serialise via `toJSON/fromJSON` |
| `Storage` | Persistence: `save()` → localStorage + DOM tag; `exportHTML()` → versioned self-contained file download; `exportFile()` → `.labwip` JSON; `manualSave()`, `markDirty()` (debounced 400 ms) |
| `App` | Lifecycle: `init()`, `refresh()`, `switchView(name)`, autosave timer. `refresh()` calls `Storage.markDirty()` — every view change triggers a deferred save. |
| `TaskModal` | Create/edit dialog. `open(taskId?)` populates from `AppState.getTask`; `save()` captures `wasEdit` before `close()`, then calls `AppState.saveTask` then `App.refresh()`. |
| `Dashboard` | Canvas-based KPI charts. Uses `ResizeObserver` to redraw on resize. Shows empty state when no tasks exist. |
| `TableView` | Sortable/filterable `<table>`. Filters held in `TableView._filters`. |
| `Gantt` | Canvas timeline. Zoom levels: day/week/month. Scroll sync between task list and header. Click detection via `_barRects`. Tooltip guard stored on `Gantt._tooltipBound` (not on the canvas element). |
| `GanttFilters` | Filter state for the Gantt view. |
| `KanbanView` | Kanban board with drag-and-drop. Equal-height columns. Shows empty state when filtered tasks = 0. |
| `Settings` | Editable dropdown lists, theme toggle, autosave interval, holiday calendar, data management buttons. |
| `Toast` | Non-blocking notification toasts. |

**Data flow for a save:**
1. Any mutation calls `AppState.saveTask` / `deleteTask`.
2. `App.refresh()` re-renders the current view and calls `Storage.markDirty()`.
3. After 400 ms debounce, `Storage.save()` writes to `localStorage` and updates the in-memory embedded `<script id="labwip-embedded-data">` tag.
4. For portable export: `Storage.exportHTML()` increments `AppState.settings.saveVersion`, serialises `document.documentElement.outerHTML`, and downloads it as `WIPflow_vMAJOR.MINOR.SAVE.html`.

**WorkCalendar end-date formula:**
`calendarDays = ceil(workdays / (allocPct / 100))`, then walk forward from start skipping weekends and any date in `AppState.settings.holidays` (array of `"YYYY-MM-DD"` or `"YYYY-MM-DD Name"` strings).

## Versioning

Version format: `MAJOR.MINOR.SAVE`

| Part | Changed by | When |
|---|---|---|
| `MAJOR` | Developer (edit `APP_BASE_VERSION`) | Breaking changes or major new features |
| `MINOR` | Developer (edit `APP_BASE_VERSION`) | Bug fixes, small improvements |
| `SAVE` | App automatically | Increments on each "Save as HTML" click |

`APP_BASE_VERSION` is a constant near the top of the JS section (`const APP_BASE_VERSION = '1.3';`).  
`saveVersion` lives in `AppState.settings` and persists in localStorage and embedded data.  
**Bump `MINOR` when shipping bug fixes or small improvements. Bump `MAJOR` for breaking changes or significant new features.**

## Data schema

`.labwip` files and `localStorage` both use:
```json
{
  "version": "1.0",
  "settings": {
    "theme", "autosaveIntervalMinutes", "saveVersion",
    "labs", "persons", "priorities", "statuses", "tags",
    "holidays"
  },
  "tasks": [{ "id", "name", "lab", "person", "priority", "status", "startDate", "endDate",
               "workdays", "alloc", "progress", "description", "tags", "notes", "created", "modified" }]
}
```
`AppState.fromJSON` merges `DEFAULT_SETTINGS` with stored settings, so new setting keys added to `DEFAULT_SETTINGS` appear automatically for existing users.

## Key conventions

- **No classes** — all modules are plain object literals with underscore-prefixed private methods.
- **Canvas rendering** — Dashboard charts and Gantt timeline draw directly to `<canvas>` elements; they have no virtual DOM.
- **Inline HTML in JS** — views are rendered by assigning template-literal HTML strings to `el.innerHTML`. Always escape user content with `escHtml()` before interpolation.
- **View switching** — `App.switchView(name)` toggles CSS visibility and calls the relevant `render()`. Only the active view is rendered on `App.refresh()`. Help and About are static — no render function needed.
- **`Storage.markDirty()` vs `Storage.save()`** — use `markDirty()` for anything triggered by UI interaction (debounced); use `save()` only when an immediate write is required (e.g. after import).
- **Holiday changes** — call `App.refresh()` after `Storage.save()` whenever holidays are added/removed so all task end dates recalculate.
- **Theme changes** — call the relevant `render()` for the active canvas-based view (Dashboard, Gantt) and `KanbanView.render()` for Kanban in `Settings.setTheme()`.

## Maintenance rules

### After any feature or bug fix
1. **Test in the preview panel** — use `/verify` or `/run` to open the app and exercise the changed path.
2. **Bump `APP_BASE_VERSION` MINOR** if fixing bugs or adding minor features (e.g. `'1.2'` → `'1.3'`). Bump MAJOR for breaking changes.
3. **Update the in-app Help view** (`#view-help` in the HTML) if the change affects user-visible behaviour.
4. **Update the in-app About view** changelog section (`#view-about`) with a bullet under the new version.
5. **Update TODO.md** — mark completed items, add new backlog entries.
6. **Commit** with a descriptive message following the style of recent commits (`git log --oneline -5`).

### TODO.md usage
- Treat `TODO.md` as both a **backlog** of planned improvements and a **completed log** of shipped items.
- Keep completed items in a `## ✅ Completed` table with the fix described.
- New items go under priority sections (`🔴 Bugs`, `🟠 Improvements`, `🟡 UX`, etc.).
- Reference `TODO.md` items by number in commit messages when relevant.

### Committing
- Stage only `WIPflow.html` and any markdown files that were intentionally changed.
- Never commit `.labwip` export files, temp files, or generated assets that aren't part of the source.
- Commit message style: imperative subject line, body with bullet points for grouped changes.
- Add `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>` as a trailer.
