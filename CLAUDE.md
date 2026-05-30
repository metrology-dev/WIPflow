# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

LabWIP is a single-file offline-first HTML application (`WIPflow.html`) for tracking laboratory work-in-progress. There is no build step, no package manager, no transpilation — all code is inline HTML/CSS/JS. Open the file directly in a browser to run it.

## Development workflow

No build or lint commands exist. To develop:
- Open `WIPflow.html` in a browser (Firefox is the primary target).
- Edit the file and reload the browser tab.
- The browser console is the only debugger.

## Architecture

The entire application lives in `WIPflow.html` (~3 000 lines), structured as a sequence of named JS object modules. Execution order matters — modules are defined in dependency order and reference each other by name.

**Module map (in declaration order):**

| Module | Role |
|---|---|
| `DEFAULT_SETTINGS` | Constant — seed values for labs, persons, priorities, statuses, tags |
| `WorkCalendar` | Date arithmetic: `isWorkday`, `calcEndDate(startStr, workdays, allocPct)`, `fmt`, `parse` |
| `AppState` | In-memory store: `tasks[]`, `settings{}`. CRUD via `saveTask(data)`, `deleteTask(id)`, `getTask(id)`, `getFilteredTasks(filters, sortCol, sortDir)`, serialise via `toJSON/fromJSON` |
| `Storage` | Persistence: `save()` → localStorage + DOM tag; `exportHTML()` → self-contained file download; `exportFile()` → `.labwip` JSON; `manualSave()`, `markDirty()` (debounced 400 ms) |
| `App` | Lifecycle: `init()`, `refresh()`, `switchView(name)`, autosave timer. `refresh()` calls `Storage.markDirty()` — every view change triggers a deferred save. |
| `TaskModal` | Create/edit dialog. `open(taskId?)` populates from `AppState.getTask`; `save()` calls `AppState.saveTask` then `App.refresh()`. |
| `Dashboard` | Canvas-based KPI charts. Uses `ResizeObserver` to redraw on resize. |
| `TableView` | Sortable/filterable `<table>`. Filters held in `TableView._filters`. |
| `Gantt` | Canvas timeline. Zoom levels: day/week/month. Scroll sync between task list and header. Click detection via `_barRects`. |
| `GanttFilters` | Filter state for the Gantt view. |
| `Settings` | Editable dropdown lists, theme toggle, autosave interval, data management buttons. |
| `Toast` | Non-blocking notification toasts. |

**Data flow for a save:**
1. Any mutation calls `AppState.saveTask` / `deleteTask`.
2. `App.refresh()` re-renders the current view and calls `Storage.markDirty()`.
3. After 400 ms debounce, `Storage.save()` writes to `localStorage` and updates the in-memory embedded `<script id="labwip-embedded-data">` tag.
4. For portable export: `Storage.exportHTML()` serialises `document.documentElement.outerHTML` (which contains the populated embedded tag) and downloads it as `WIPflow.html`.

**WorkCalendar end-date formula:**
`calendarDays = ceil(workdays / (allocPct / 100))`, then walk forward from start skipping non-workdays. Holidays are not yet factored in — `isWorkday` only checks `getDay() !== 0 && getDay() !== 6`.

## Data schema

`.labwip` files and `localStorage` both use:
```json
{
  "version": "1.0",
  "settings": { "theme", "autosaveIntervalMinutes", "labs", "persons", "priorities", "statuses", "tags" },
  "tasks": [{ "id", "name", "lab", "person", "priority", "status", "startDate", "endDate",
               "workdays", "alloc", "progress", "description", "tags", "notes", "created", "modified" }]
}
```
`AppState.fromJSON` merges `DEFAULT_SETTINGS` with stored settings, so new setting keys added to `DEFAULT_SETTINGS` appear automatically for existing users.

## Key conventions

- **No classes** — all modules are plain object literals with underscore-prefixed private methods.
- **Canvas rendering** — Dashboard charts and Gantt timeline draw directly to `<canvas>` elements; they have no virtual DOM.
- **Inline HTML in JS** — views are rendered by assigning template-literal HTML strings to `el.innerHTML`. Escape user content with `escHtml()` before interpolation.
- **View switching** — `App.switchView(name)` toggles CSS visibility and calls the relevant `render()`. Only the active view is rendered on `App.refresh()`.
- **`Storage.markDirty()` vs `Storage.save()`** — use `markDirty()` for anything triggered by UI interaction (debounced); use `save()` only when an immediate write is required (e.g. after import).
